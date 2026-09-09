import { readDocument } from "./work-document.js";

const DATABASE = "liangos-fold-draft";
const KEY = "current";

/** One atomic current draft. Images are rewritten only when the image changes. */
export function createDraftStore() {
  let database;
  let revision = 0;
  let savedImage;

  async function open() {
    if (database) return database;
    database = await new Promise((resolve, reject) => {
      let blocked = false;
      const request = indexedDB.open(DATABASE, 1);
      request.onupgradeneeded = () => {
        request.result.createObjectStore("documents");
        request.result.createObjectStore("images");
      };
      request.onsuccess = () => {
        if (blocked) request.result.close();
        else resolve(request.result);
      };
      request.onerror = () => reject(request.error);
      request.onblocked = () => {
        blocked = true;
        reject(new Error("本机草稿被其他窗口占用，请关闭旧页面后重试。"));
      };
    });
    database.onversionchange = () => {
      database.close();
      database = null;
    };
    return database;
  }

  return {
    async load() {
      const db = await open();
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["documents", "images"], "readonly");
        const content = tx.objectStore("documents").get(KEY);
        const image = tx.objectStore("images").get(KEY);
        tx.oncomplete = () => {
          try {
            const record = content.result;
            if (!record) return resolve(null);
            if (record.version !== 1)
              throw new Error("草稿版本无法识别，原草稿未改动。");
            if (
              !Number.isInteger(record.revision) ||
              record.revision < 1 ||
              (record.hasImage && !(image.result instanceof Blob))
            ) {
              throw new Error("草稿记录不完整，原草稿未改动。");
            }
            const document = readDocument({
              ...record.document,
              imageBlob: image.result ?? null,
            });
            revision = record.revision;
            savedImage = document.imageBlob;
            resolve(document);
          } catch (error) {
            reject(error);
          }
        };
        tx.onabort = () => reject(tx.error);
      });
    },
    async save(document) {
      const db = await open();
      const { imageBlob, ...content } = document;
      return new Promise((resolve, reject) => {
        const tx = db.transaction(["documents", "images"], "readwrite");
        const store = tx.objectStore("documents");
        let conflict;
        const current = store.get(KEY);
        current.onsuccess = () => {
          if ((current.result?.revision ?? 0) !== revision) {
            conflict = new Error(
              "另一标签页已更新草稿。请先导出当前作品，再刷新读取最新草稿。",
            );
            conflict.name = "DraftConflictError";
            tx.abort();
            return;
          }
          store.put(
            {
              version: 1,
              revision: revision + 1,
              hasImage: Boolean(imageBlob),
              document: content,
            },
            KEY,
          );
          if (imageBlob !== savedImage) tx.objectStore("images").put(imageBlob, KEY);
        };
        tx.oncomplete = () => {
          revision += 1;
          savedImage = imageBlob;
          resolve();
        };
        tx.onabort = () => reject(conflict ?? tx.error ?? new Error("草稿未保存。"));
      });
    },
  };
}

/** Serial writes coalesce pending edits; only a successful final write is 'saved'. */
export function createAutoSave(write, onStatus) {
  let latest = null;
  let saved = null;
  let running = null;
  function flush() {
    if (running) return running;
    if (latest === saved) return Promise.resolve();
    onStatus("saving");
    running = (async () => {
      try {
        while (latest !== saved) {
          const current = latest;
          await Promise.resolve().then(() => write(current));
          saved = current;
        }
        onStatus("saved");
      } catch (error) {
        onStatus("error", error);
      } finally {
        running = null;
      }
    })();
    return running;
  }
  return {
    get dirty() {
      return latest !== saved;
    },
    schedule(document) {
      latest = { ...document };
      return flush();
    },
    flush,
  };
}
