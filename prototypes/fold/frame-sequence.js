import { DURATION_SECONDS } from "./geometry.js";

export const FRAME_RATE = 30;
export const FRAME_COUNT = FRAME_RATE * DURATION_SECONDS;

export function frameTiming(index) {
  if (!Number.isInteger(index) || index < 0 || index >= FRAME_COUNT) {
    throw new RangeError("Invalid frame index");
  }
  return {
    index,
    timestamp: index / FRAME_RATE,
    duration: 1 / FRAME_RATE,
    progress: index / FRAME_COUNT,
  };
}

// Backpressure, not the wall clock, decides when the next frame is drawn.
export async function renderSequence({
  render,
  addFrame,
  onProgress,
  signal,
  yieldTask = () => new Promise((resolve) => setTimeout(resolve, 0)),
}) {
  for (let index = 0; index < FRAME_COUNT; index += 1) {
    signal?.throwIfAborted();
    const frame = frameTiming(index);
    await render(frame);
    signal?.throwIfAborted();
    await addFrame(frame);
    signal?.throwIfAborted();
    onProgress?.((index + 1) / FRAME_COUNT, index + 1);
    await yieldTask();
  }
}
