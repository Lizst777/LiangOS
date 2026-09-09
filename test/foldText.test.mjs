import test from "node:test";
import assert from "node:assert/strict";
import { layoutCaption } from "../prototypes/fold/text-layout.js";

function context() {
  return {
    font: "",
    measureText(text) {
      return { width: [...text].length * Number.parseFloat(this.font) };
    },
  };
}

const options = { width: 930, size: 34, family: "serif" };

test("short captions keep their intended font size", () => {
  assert.deepEqual(layoutCaption(context(), "让这一刻，慢一点。", options), {
    lines: ["让这一刻，慢一点。"],
    size: 34,
  });
});

test("64 Chinese characters remain complete in two readable lines", () => {
  const text = "风".repeat(64);
  const result = layoutCaption(context(), text, options);
  assert.equal(result.lines.join(""), text);
  assert.ok(result.size >= 28);
  assert.equal(result.lines.length, 2);
  assert.ok(result.lines.every((line) => [...line].length * result.size <= 930));
});

test("English words wrap at spaces and oversized words retain all characters", () => {
  const ctx = context();
  const result = layoutCaption(ctx, "one two three four", {
    ...options,
    width: 260,
    maxLines: 3,
  });
  assert.deepEqual(result.lines, ["one two", "three", "four"]);
  const long = "abcdefghij".repeat(6);
  const wrapped = layoutCaption(ctx, long, options);
  assert.equal(wrapped.lines.join(""), long);
  assert.ok(wrapped.lines.length <= 2);
});

test("empty captions have no lines; emoji remain intact", () => {
  assert.deepEqual(layoutCaption(context(), "", options).lines, []);
  const result = layoutCaption(context(), "🌊".repeat(40), options);
  assert.equal(result.lines.join(""), "🌊".repeat(40));
});
