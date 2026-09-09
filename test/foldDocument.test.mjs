import test from "node:test";
import assert from "node:assert/strict";
import { createHistory, DEFAULT_DOCUMENT, readDocument } from "../src/work-document.js";
import { createAutoSave } from "../src/draft-store.js";
import { createDocumentSession } from "../src/document-session.js";

const doc = (patch = {}) => ({ ...DEFAULT_DOCUMENT, ...patch });
function deferred() {
  let resolve;
  let reject;
  const promise = new Promise((yes, no) => {
    resolve = yes;
    reject = no;
  });
  return { promise, resolve, reject };
}

test("draft validation rejects corrupt fields and excludes runtime state", () => {
  const clean = readDocument({ ...doc(), progress: 0.7, image: {} });
  assert.equal("progress" in clean, false);
  assert.equal("image" in clean, false);
  for (const bad of [
    { zoom: NaN },
    { ratio: "4:3" },
    { paper: "red" },
    { title: 2 },
    { imageBlob: {} },
  ]) {
    assert.throws(() => readDocument(doc(bad)));
  }
});

test("typing merges until a pause or explicit group boundary", () => {
  const history = createHistory(doc());
  history.commit(doc({ title: "A" }), "title", 0);
  history.commit(doc({ title: "AB" }), "title", 100);
  assert.equal(history.move(-1).title, "STILL");
  assert.equal(history.move(1).title, "AB");
  history.commit(doc({ title: "ABC" }), "title", 900);
  history.endGroup();
  history.commit(doc({ title: "ABCD" }), "title", 950);
  assert.equal(history.move(-1).title, "ABC");
  assert.equal(history.move(-1).title, "AB");
});

test("one long drag remains one step and the next drag is independent", () => {
  const history = createHistory(doc());
  history.commit(doc({ cropX: 0.2 }), "gesture:crop", 0);
  history.commit(doc({ cropX: 0.8 }), "gesture:crop", 5000);
  history.endGroup();
  history.commit(doc({ cropX: 0.9 }), "gesture:crop", 5050);
  assert.equal(history.move(-1).cropX, 0.8);
  assert.equal(history.move(-1).cropX, 0);
});

test("editing after undo discards redo while no-op edits add no step", () => {
  const history = createHistory(doc());
  assert.equal(history.commit(doc()), false);
  history.commit(doc({ title: "A" }));
  history.commit(doc({ title: "B" }));
  history.move(-1);
  history.commit(doc({ title: "C" }));
  assert.equal(history.canRedo, false);
  assert.equal(history.move(-1).title, "A");
});

test("history is bounded by entries and unique image bytes", () => {
  const history = createHistory(doc(), { limit: 3, imageBudget: 5 });
  for (let i = 0; i < 6; i++) history.commit(doc({ title: String(i) }));
  history.move(-1);
  history.move(-1);
  assert.equal(history.canUndo, false);
  const a = new Blob(["123"], { type: "image/png" });
  const b = new Blob(["456"], { type: "image/png" });
  history.commit(doc({ imageBlob: a }));
  history.commit(doc({ title: "same blob", imageBlob: a }));
  assert.equal(history.current.imageBlob, a);
  history.commit(doc({ imageBlob: b }));
  assert.equal(history.current.imageBlob, b);
  assert.equal(history.canUndo, false);
});

test("autosave serializes writes and coalesces pending edits", async () => {
  const gate = deferred();
  const written = [];
  const statuses = [];
  const saver = createAutoSave(
    async (value) => {
      written.push(value.title);
      if (written.length === 1) await gate.promise;
    },
    (status) => statuses.push(status),
  );
  const saving = saver.schedule(doc({ title: "A" }));
  await Promise.resolve();
  saver.schedule(doc({ title: "B" }));
  saver.schedule(doc({ title: "C" }));
  assert.equal(saver.dirty, true);
  gate.resolve();
  await saving;
  assert.deepEqual(written, ["A", "C"]);
  assert.equal(saver.dirty, false);
  assert.equal(statuses.at(-1), "saved");
});

test("failed storage never reports saved and can retry even after a synchronous throw", async () => {
  let fail = true;
  const statuses = [];
  const saver = createAutoSave(
    () => {
      if (fail) throw new Error("quota");
    },
    (status) => statuses.push(status),
  );
  await saver.schedule(doc());
  assert.equal(saver.dirty, true);
  assert.equal(statuses.at(-1), "error");
  fail = false;
  await saver.flush();
  assert.equal(saver.dirty, false);
  assert.equal(statuses.at(-1), "saved");
});

function sessionSetup(overrides = {}) {
  const saved = [];
  const errors = [];
  const session = createDocumentSession({
    store: { load: async () => null, save: async (value) => saved.push(value) },
    apply: async () => {},
    render() {},
    onChange() {},
    onStatus() {},
    onError: (error) => errors.push(error),
    ...overrides,
  });
  return { session, saved, errors };
}

test("restoring establishes a clean base, undo and redo persist the selected content", async () => {
  const { session, saved } = sessionSetup();
  await session.initialize();
  assert.equal(saved.length, 0);
  session.change({ title: "My poster" });
  await session.flush();
  await session.travel(-1);
  await session.flush();
  assert.equal(saved.at(-1).title, "STILL");
  await session.travel(1);
  await session.flush();
  assert.equal(saved.at(-1).title, "My poster");
});

test("new document is undoable, including its image and crop", async () => {
  const imageBlob = new Blob(["image"], { type: "image/png" });
  const original = doc({ title: "Keep me", imageBlob, cropX: 0.4 });
  const { session } = sessionSetup({
    store: { load: async () => original, save: async () => {} },
  });
  await session.initialize();
  await session.newDocument();
  assert.equal(session.current.imageBlob, null);
  await session.travel(-1);
  assert.deepEqual(session.current, original);
});

test("failed image preparation preserves history and current document", async () => {
  let fail = false;
  const { session, errors } = sessionSetup({
    apply: async () => {
      if (fail) throw new Error("decode");
    },
  });
  await session.initialize();
  fail = true;
  await session.replaceImage(new Blob(["broken"], { type: "image/png" }));
  assert.equal(session.current.imageBlob, null);
  assert.equal(session.canUndo, false);
  assert.equal(session.busy, false);
  assert.equal(errors.length, 1);
});

test("unreadable drafts are not silently overwritten by later edits", async () => {
  let writes = 0;
  const { session } = sessionSetup({
    store: {
      load: async () => {
        throw new Error("broken draft");
      },
      save: async () => {
        writes++;
      },
    },
  });
  await session.initialize();
  session.change({ title: "New local edit" });
  await session.flush();
  assert.equal(writes, 0);
  assert.equal(session.dirty, true);
});
