import { DURATION_SECONDS } from "./geometry.js";
import { drawFrame } from "./renderer.js";
import { renderSequence, FRAME_RATE, FRAME_COUNT } from "./frame-sequence.js";

let codecLibrary;
const loadCodecs = () => (codecLibrary ??= import("mediabunny"));

export async function supportedVideo(width, height) {
  if (!globalThis.VideoEncoder || !globalThis.VideoFrame) return null;
  const { canEncodeVideo, Quality } = await loadCodecs();
  const quality = new Quality({ bitrate: 8_000_000 });
  for (const format of [
    { codec: "avc", extension: "mp4", label: "MP4", mime: "video/mp4" },
    { codec: "vp9", extension: "webm", label: "WebM", mime: "video/webm" },
  ]) {
    if (await canEncodeVideo(format.codec, { width, height, quality })) return format;
  }
  return null;
}

export function pngBlob(canvas) {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => (blob ? resolve(blob) : reject(new Error("图片生成失败，请重试。"))),
      "image/png",
    );
  });
}

export async function encodeVideo(texture, amplitude, format, onProgress, signal) {
  const {
    Output,
    BufferTarget,
    CanvasSource,
    Mp4OutputFormat,
    WebMOutputFormat,
    Quality,
  } = await loadCodecs();
  signal?.throwIfAborted();
  const canvas = document.createElement("canvas");
  canvas.width = texture.width;
  canvas.height = texture.height;
  const target = new BufferTarget();
  const output = new Output({
    format:
      format.extension === "mp4"
        ? new Mp4OutputFormat({ fastStart: "in-memory" })
        : new WebMOutputFormat(),
    target,
  });
  let encodedFrames = 0;
  const source = new CanvasSource(canvas, {
    codec: format.codec,
    quality: new Quality({ bitrate: 8_000_000 }),
    keyFrameInterval: 1,
    onEncodedPacket: () => {
      encodedFrames += 1;
    },
  });
  output.addVideoTrack(source, { frameRate: FRAME_RATE });
  const controller = new AbortController();
  const watchdog = setTimeout(
    () =>
      controller.abort(new Error("编码长时间没有完成，已释放资源。请重试或导出 PNG。")),
    5 * 60_000,
  );
  const cancel = () => controller.abort(new Error("已取消导出。"));
  const visibility = () => {
    if (document.hidden)
      controller.abort(new Error("页面已进入后台，导出已取消。回到前台后可重新生成。"));
  };
  const release = () => {
    void output.cancel().catch(() => {});
  };
  signal?.addEventListener("abort", cancel, { once: true });
  controller.signal.addEventListener("abort", release, { once: true });
  document.addEventListener("visibilitychange", visibility);
  try {
    if (signal?.aborted) cancel();
    controller.signal.throwIfAborted();
    await output.start();
    await renderSequence({
      signal: controller.signal,
      render: ({ progress }) => drawFrame(canvas, texture, progress, amplitude),
      addFrame: ({ timestamp, duration }) => source.add(timestamp, duration),
      onProgress,
    });
    await output.finalize();
    controller.signal.throwIfAborted();
    if (encodedFrames !== FRAME_COUNT || !target.buffer?.byteLength) {
      throw new Error("视频帧数不完整，未输出文件，请重试。");
    }
    return {
      blob: new Blob([target.buffer], { type: format.mime }),
      frameCount: encodedFrames,
      frameRate: FRAME_RATE,
      duration: DURATION_SECONDS,
    };
  } catch (error) {
    await output.cancel().catch(() => {});
    throw controller.signal.aborted ? controller.signal.reason : error;
  } finally {
    clearTimeout(watchdog);
    signal?.removeEventListener("abort", cancel);
    controller.signal.removeEventListener("abort", release);
    document.removeEventListener("visibilitychange", visibility);
    canvas.width = canvas.height = 1;
  }
}

export function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 60_000);
}
