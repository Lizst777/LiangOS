import { dimensions, DURATION_SECONDS, sceneAt, smoothstep } from "./geometry.js";
import { drawFrame } from "./renderer.js";
import { makeTexture } from "./poster-texture.js";

const EDIT_PROGRESS = 0.45;
const EDIT_DURATION_MS = 460;
const POSE_KEYS = ["left", "right", "flip", "tilt"];

/** Owns the preview texture and animation clock, never form or export state. */
export function createPreview({ canvas, play, stages, mode, scrubber, time }, state) {
  let texture;
  let progress = 0.5;
  let playing = false;
  let frame = 0;
  let lastTime = null;
  let editPose = null;

  function render() {
    if (!texture) return;
    const { phase } = sceneAt(progress, state.amplitude);
    drawFrame(canvas, texture, progress, state.amplitude, editPose);
    mode.textContent = editPose
      ? "编辑 / 展开纸面"
      : `${phase} / ${DURATION_SECONDS} 秒循环`;
    for (const button of stages) {
      button.setAttribute("aria-pressed", String(button.textContent === phase));
    }
    scrubber.value = progress;
    time.value = `${(progress * DURATION_SECONDS).toFixed(1).padStart(4, "0")} / ${DURATION_SECONDS.toFixed(1)}s`;
  }

  function pause() {
    cancelAnimationFrame(frame);
    playing = false;
    lastTime = null;
    editPose = null;
    play.textContent = "▶";
    play.setAttribute("aria-label", "播放动画");
    render();
  }

  function tick(now) {
    if (!playing) return;
    if (lastTime !== null) {
      progress = (progress + (now - lastTime) / (DURATION_SECONDS * 1000)) % 1;
    }
    lastTime = now;
    render();
    frame = requestAnimationFrame(tick);
  }

  function start() {
    pause();
    playing = true;
    play.textContent = "Ⅱ";
    play.setAttribute("aria-label", "暂停动画");
    frame = requestAnimationFrame(tick);
  }

  function seek(value) {
    pause();
    progress = value;
    render();
  }

  function beginEdit() {
    if (editPose) return;
    const from = sceneAt(progress, state.amplitude);
    pause();
    progress = EDIT_PROGRESS;
    if (matchMedia("(prefers-reduced-motion: reduce)").matches) {
      render();
      return;
    }
    const target = sceneAt(progress, state.amplitude);
    from.flip = Math.atan2(Math.sin(from.flip), Math.cos(from.flip));
    const startTime = performance.now();
    editPose = from;
    function open(now) {
      const t = smoothstep((now - startTime) / EDIT_DURATION_MS);
      editPose = { ...target };
      for (const key of POSE_KEYS) {
        editPose[key] = from[key] + (target[key] - from[key]) * t;
      }
      if (t === 1) editPose = null;
      render();
      if (t < 1) frame = requestAnimationFrame(open);
    }
    frame = requestAnimationFrame(open);
  }

  function rebuild() {
    texture = makeTexture(state);
    const size = dimensions(state.ratio);
    // Preview uses less memory; export retains the full-resolution texture.
    canvas.width = 810;
    canvas.height = Math.round(size.height * 0.75);
    render();
  }

  return {
    beginEdit,
    rebuild,
    pause,
    start,
    seek,
    toggle: () => (playing ? pause() : start()),
    updateAmplitude: () => (playing ? render() : seek(0.1)),
    snapshot: () => ({ texture, amplitude: state.amplitude }),
  };
}
