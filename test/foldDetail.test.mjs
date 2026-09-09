import test from "node:test";
import assert from "node:assert/strict";
import { detailSize, createDetailViewer } from "../prototypes/fold/detail-viewer.js";

test("detail sizing fits portrait, square and landscape without clipping", () => {
  for (const ratio of [0.75, 1, 9 / 16]) {
    const size = detailSize(358, 640, ratio, 1);
    assert.ok(size.width <= 358 && size.height <= 640);
    assert.equal(size.width / size.height, ratio);
    const zoomed = detailSize(358, 640, ratio, 2);
    assert.equal(zoomed.width, size.width * 2);
    assert.equal(zoomed.height, size.height * 2);
  }
});

test("viewer reads a snapshot, switches sides, resets zoom and releases on close", (t) => {
  const draws = [];
  let disconnected = 0;
  const previous = globalThis.ResizeObserver;
  globalThis.ResizeObserver = class {
    observe() {}
    disconnect() {
      disconnected += 1;
    }
  };
  t.after(() => {
    if (previous) globalThis.ResizeObserver = previous;
    else delete globalThis.ResizeObserver;
  });
  function element() {
    const events = new Map();
    return {
      style: {},
      clientWidth: 358,
      clientHeight: 640,
      addEventListener: (name, handler) => events.set(name, handler),
      emit: (name) => events.get(name)?.(),
      setAttribute(name, value) {
        this[name] = value;
      },
      getContext: () => ({ drawImage: (image) => draws.push(image) }),
      showModal() {
        this.open = true;
      },
      close() {
        this.open = false;
        this.emit("close");
      },
      focus() {
        this.focused = true;
      },
    };
  }
  const ui = Object.fromEntries(
    ["dialog", "open", "close", "front", "back", "zoom", "scroller", "canvas"].map(
      (name) => [name, element()],
    ),
  );
  const texture = Object.freeze({ width: 1080, height: 1440, front: {}, back: {} });
  let pauses = 0;
  createDetailViewer(ui, { snapshot: () => ({ texture }), pause: () => pauses++ });
  ui.open.emit("click");
  assert.equal(pauses, 1);
  assert.equal(draws.at(-1), texture.front);
  ui.back.emit("click");
  assert.equal(draws.at(-1), texture.back);
  ui.zoom.emit("click");
  assert.equal(ui.canvas.style.width, "716px");
  ui.close.emit("click");
  assert.equal(ui.canvas.width, 1);
  assert.equal(ui.open.focused, true);
  assert.equal(disconnected, 1);
  ui.open.emit("click");
  assert.equal(ui.zoom["aria-pressed"], "false");
  assert.equal(draws.at(-1), texture.front);
});
