import test from "node:test";
import assert from "node:assert/strict";
import {
  createEditorPanels,
  trackEditorViewport,
} from "../prototypes/fold/editor-panels.js";

function element(name, ownerDocument) {
  const listeners = {};
  const attributes = {};
  return {
    dataset: { pane: name },
    ownerDocument,
    hidden: false,
    attributes,
    addEventListener(type, handler) {
      listeners[type] = handler;
    },
    emit(type, event = {}) {
      listeners[type]?.(event);
    },
    setAttribute(key, value) {
      attributes[key] = value;
    },
    removeAttribute(key) {
      delete attributes[key];
    },
    focus() {
      ownerDocument.activeElement = this;
    },
    contains(child) {
      return this === child || this.input === child;
    },
    querySelector() {
      return this.input;
    },
  };
}

function setup(compact = true) {
  const ownerDocument = { activeElement: null };
  const buttons = ["image", "text", "style"].map((name) =>
    element(name, ownerDocument),
  );
  const panels = buttons.map((button) => {
    const panel = element(button.dataset.pane, ownerDocument);
    panel.input = element("input", ownerDocument);
    return panel;
  });
  const tabs = element("tabs", ownerDocument);
  tabs.querySelectorAll = () => buttons;
  const media = element("media", ownerDocument);
  media.matches = compact;
  const scroller = { scrollTop: 10 };
  const help = { open: true };
  let switches = 0;
  createEditorPanels({
    tabs,
    panels,
    scroller,
    help,
    media,
    onSwitch: () => {
      switches++;
    },
  });
  return {
    tabs,
    panels,
    buttons,
    media,
    ownerDocument,
    scroller,
    help,
    get switches() {
      return switches;
    },
  };
}

test("compact editor exposes only one panel and never recreates its input", () => {
  const ui = setup();
  assert.deepEqual(
    ui.panels.map((p) => p.hidden),
    [true, false, true],
  );
  const input = ui.panels[1].input;
  input.value = "Keep this text";
  ui.buttons[0].emit("click");
  assert.deepEqual(
    ui.panels.map((p) => p.hidden),
    [false, true, true],
  );
  ui.buttons[1].emit("click");
  assert.equal(ui.panels[1].input, input);
  assert.equal(input.value, "Keep this text");
  assert.equal(ui.scroller.scrollTop, 0);
});

test("tab keyboard navigation wraps and supports Home and End", () => {
  const ui = setup();
  let prevented = 0;
  const event = (key) => ({
    key,
    preventDefault() {
      prevented++;
    },
  });
  ui.buttons[1].emit("keydown", event("End"));
  assert.equal(ui.ownerDocument.activeElement, ui.buttons[2]);
  ui.buttons[2].emit("keydown", event("ArrowRight"));
  assert.equal(ui.ownerDocument.activeElement, ui.buttons[0]);
  ui.buttons[0].emit("keydown", event("ArrowLeft"));
  assert.equal(ui.ownerDocument.activeElement, ui.buttons[2]);
  ui.buttons[2].emit("keydown", event("Home"));
  assert.equal(ui.ownerDocument.activeElement, ui.buttons[0]);
  assert.deepEqual(
    ui.buttons.map((b) => b.tabIndex),
    [0, -1, -1],
  );
  assert.equal(prevented, 4);
});

test("desktop exposes all controls and moves focus out of the hidden tab bar", () => {
  const ui = setup();
  ui.buttons[2].emit("click");
  ui.buttons[2].focus();
  ui.media.matches = false;
  ui.media.emit("change");
  assert.equal(ui.tabs.hidden, true);
  assert.equal(ui.help.open, true);
  assert.ok(ui.panels.every((p) => !p.hidden && !p.attributes.role));
  assert.equal(ui.ownerDocument.activeElement, ui.panels[2].input);
});

test("returning to compact mode preserves the currently focused field", () => {
  const ui = setup(false);
  ui.panels[0].input.focus();
  ui.media.matches = true;
  ui.media.emit("change");
  assert.deepEqual(
    ui.panels.map((p) => p.hidden),
    [false, true, true],
  );
  assert.equal(ui.panels[0].attributes["aria-labelledby"], "tab-image");
});

test("visible viewport height updates without constraining pinch zoom", () => {
  const properties = new Map();
  const root = {
    style: {
      setProperty: (k, v) => properties.set(k, v),
      removeProperty: (k) => properties.delete(k),
    },
  };
  const viewport = element("viewport", {});
  Object.assign(viewport, { height: 844, scale: 1 });
  trackEditorViewport(root, viewport);
  assert.equal(properties.get("--editor-viewport-height"), "844px");
  viewport.height = 430;
  viewport.emit("resize");
  assert.equal(properties.get("--editor-viewport-height"), "430px");
  viewport.scale = 2;
  viewport.emit("resize");
  assert.equal(properties.has("--editor-viewport-height"), false);
  assert.doesNotThrow(() => trackEditorViewport(root, null));
});
