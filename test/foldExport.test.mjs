import assert from "node:assert/strict";
import test from "node:test";
import {
  FRAME_COUNT,
  FRAME_RATE,
  frameTiming,
  renderSequence,
} from "../src/frame-sequence.js";

test("fixed timeline contains 300 continuous frames ending at exactly ten seconds", () => {
  assert.equal(FRAME_COUNT, 300);
  assert.equal(FRAME_RATE, 30);
  const last = frameTiming(FRAME_COUNT - 1);
  assert.equal(last.timestamp + last.duration, 10);
  assert.equal(frameTiming(0).timestamp, 0);
  assert.throws(() => frameTiming(300), RangeError);
  assert.throws(() => frameTiming(-1), RangeError);
});

test("slow asynchronous encoding never skips or overlaps frames", async () => {
  const submitted = [];
  let pending = false;
  let latest = -1;
  await renderSequence({
    render: ({ index }) => {
      assert.equal(pending, false);
      latest = index;
    },
    addFrame: async (frame) => {
      pending = true;
      await new Promise((resolve) =>
        setTimeout(resolve, frame.index % 17 === 0 ? 4 : 0),
      );
      assert.equal(latest, frame.index);
      submitted.push(frame);
      pending = false;
    },
    yieldTask: async () => {},
  });
  assert.deepEqual(
    submitted.map((frame) => frame.index),
    Array.from({ length: 300 }, (_, index) => index),
  );
  assert.equal(submitted[150].timestamp, 5);
});

test("cancel stops before the next frame and a fresh job can complete", async () => {
  const controller = new AbortController();
  let count = 0;
  await assert.rejects(
    renderSequence({
      signal: controller.signal,
      render: () => {},
      addFrame: () => {
        if (++count === 9) controller.abort();
      },
      yieldTask: async () => {},
    }),
    { name: "AbortError" },
  );
  assert.equal(count, 9);
  count = 0;
  await renderSequence({
    render: () => {},
    addFrame: () => {
      count++;
    },
    yieldTask: async () => {},
  });
  assert.equal(count, 300);
});

test("encoder failure rejects instead of reporting successful completion", async () => {
  let progress = 0;
  await assert.rejects(
    renderSequence({
      render: () => {},
      addFrame: () => {
        throw new Error("Encoder failed");
      },
      onProgress: (value) => {
        progress = value;
      },
      yieldTask: async () => {},
    }),
    /Encoder failed/,
  );
  assert.equal(progress, 0);
});
