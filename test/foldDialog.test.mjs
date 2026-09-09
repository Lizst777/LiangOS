import test from "node:test";
import assert from "node:assert/strict";
import { createExportDialog } from "../src/export-dialog.js";

function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

function element() {
  const listeners = new Map();
  return {
    hidden: true,
    disabled: false,
    textContent: "",
    addEventListener: (name, handler) => listeners.set(name, handler),
    emit(name) {
      return listeners.get(name)?.();
    },
    pause() {},
    load() {},
    focus() {},
    removeAttribute(name) {
      delete this[name];
    },
    showModal() {
      this.open = true;
    },
    close() {
      this.open = false;
      this.emit("close");
    },
  };
}

const format = { label: "MP4", extension: "mp4", codec: "avc" };
const result = () => ({
  blob: new Blob(["video"]),
  frameCount: 300,
  frameRate: 30,
  duration: 10,
});

function setup(overrides = {}) {
  const ui = Object.fromEntries(
    [
      "dialog",
      "open",
      "close",
      "result",
      "download",
      "size",
      "format",
      "video",
      "png",
      "status",
      "progress",
    ].map((key) => [key, element()]),
  );
  const locks = [];
  const downloads = [];
  const files = {
    supportedVideo: async () => format,
    encodeVideo: async () => result(),
    pngBlob: async () => new Blob(["png"]),
    downloadBlob: (...args) => downloads.push(args),
    ...overrides,
  };
  createExportDialog(
    ui,
    {
      snapshot: () => ({
        texture: { width: 1080, height: 1440, front: {} },
        amplitude: 0.65,
      }),
      pause() {},
      setBusy: (busy) => locks.push(busy),
    },
    files,
  );
  return { ui, locks, downloads };
}

test("closed capability checks cannot overwrite a new dialog session", async () => {
  const old = deferred();
  let calls = 0;
  const { ui } = setup({
    supportedVideo: () => (++calls === 1 ? old.promise : Promise.resolve(null)),
  });
  const opening = ui.open.emit("click");
  ui.dialog.close();
  await ui.open.emit("click");
  old.resolve(format);
  await opening;
  assert.equal(ui.video.disabled, true);
  assert.equal(ui.format.textContent, "此浏览器不支持");
});

test("closing cancels encoding, rejects late output, and allows a clean retry", async () => {
  const pending = deferred();
  let signal;
  let calls = 0;
  const { ui, locks } = setup({
    encodeVideo: (...args) => {
      signal = args[4];
      return ++calls === 1 ? pending.promise : Promise.resolve(result());
    },
  });
  await ui.open.emit("click");
  const encoding = ui.video.emit("click");
  await ui.video.emit("click");
  assert.equal(calls, 1, "duplicate submission is blocked");
  ui.dialog.close();
  assert.equal(signal.aborted, true);
  pending.resolve(result());
  await encoding;
  assert.equal(ui.download.hidden, true);
  assert.deepEqual(locks, [true, false]);
  await ui.open.emit("click");
  await ui.video.emit("click");
  assert.equal(ui.download.hidden, false);
  assert.match(ui.status.textContent, /300 帧/);
  ui.dialog.close();
  assert.equal(ui.result.src, undefined);
  assert.equal(ui.download.hidden, true);
});

test("encoding failure releases the editor and leaves PNG available", async () => {
  const { ui, locks } = setup({
    encodeVideo: async () => {
      throw new Error("encoder failed");
    },
  });
  await ui.open.emit("click");
  await ui.video.emit("click");
  assert.deepEqual(locks, [true, false]);
  assert.equal(ui.png.disabled, false);
  assert.equal(ui.video.disabled, false);
  assert.equal(ui.progress.hidden, true);
  assert.equal(ui.status.textContent, "encoder failed");
});

test("a PNG completed after closing does not trigger an unexpected download", async () => {
  const pending = deferred();
  const { ui, downloads } = setup({ pngBlob: () => pending.promise });
  await ui.open.emit("click");
  const saving = ui.png.emit("click");
  ui.dialog.close();
  pending.resolve(new Blob(["png"]));
  await saving;
  assert.equal(downloads.length, 0);
  assert.equal(ui.png.disabled, false);
});
