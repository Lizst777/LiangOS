import { createHistory, DEFAULT_DOCUMENT, readDocument } from "./work-document.js";
import { createAutoSave } from "./draft-store.js";

/** Coordinates document history and persistence, independently of playback/export. */
export function createDocumentSession({
  store,
  apply,
  render,
  onChange,
  onStatus,
  onError,
}) {
  let history = createHistory(DEFAULT_DOCUMENT);
  let busy = true;
  let storageAvailable = true;
  let unsaved = false;
  const saver = createAutoSave((document) => store.save(document), onStatus);

  function changed() {
    unsaved = true;
    if (storageAvailable) void saver.schedule(history.current);
    onChange();
  }

  async function replace(document, direction = null) {
    if (busy) return;
    busy = true;
    onChange();
    try {
      await apply(document);
      if (direction) history.move(direction);
      else history.commit(document);
      changed();
    } catch (error) {
      onError(error);
    } finally {
      busy = false;
      onChange();
    }
  }

  return {
    get busy() {
      return busy;
    },
    get canUndo() {
      return history.canUndo;
    },
    get canRedo() {
      return history.canRedo;
    },
    get dirty() {
      return storageAvailable ? saver.dirty : unsaved;
    },
    get current() {
      return history.current;
    },
    async initialize() {
      let document = null;
      try {
        document = await store.load();
      } catch (error) {
        storageAvailable = false;
        onStatus("unavailable", error);
      }
      try {
        await apply(document ?? DEFAULT_DOCUMENT);
        history = createHistory(document ?? DEFAULT_DOCUMENT);
        if (storageAvailable) onStatus(document ? "restored" : "empty");
      } catch (error) {
        storageAvailable = false;
        onStatus("unavailable", error);
        onError(new Error("图片未能恢复，原草稿未覆盖。可尝试重新打开页面。"));
        render(DEFAULT_DOCUMENT);
      } finally {
        busy = false;
        onChange();
      }
      return Boolean(document);
    },
    change(patch, group = null) {
      if (busy) return;
      const document = readDocument({ ...history.current, ...patch });
      if (!history.commit(document, group)) return;
      render(document);
      changed();
    },
    endGroup() {
      history.endGroup();
    },
    replaceImage(blob) {
      return replace(
        readDocument({
          ...history.current,
          imageBlob: blob,
          cropX: 0,
          cropY: 0,
          zoom: 1,
        }),
      );
    },
    travel(direction) {
      const document = history.peek(direction);
      if (document) return replace(document, direction);
    },
    newDocument() {
      return replace({ ...DEFAULT_DOCUMENT });
    },
    flush() {
      return saver.flush();
    },
  };
}
