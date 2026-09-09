import * as exportFiles from "./export.js";
import { DURATION_SECONDS } from "./geometry.js";
import { FRAME_COUNT, FRAME_RATE } from "./frame-sequence.js";

/** A dialog session owns one snapshot, capability check, encoder and result URL. */
export function createExportDialog(
  ui,
  { snapshot, pause, setBusy },
  files = exportFiles,
) {
  let current;
  let format = null;
  let requestId = 0;
  let resultUrl = null;
  let exportAbort = null;

  function clearResult() {
    ui.result.pause();
    ui.result.removeAttribute("src");
    ui.result.load();
    if (resultUrl) URL.revokeObjectURL(resultUrl);
    resultUrl = null;
    ui.result.hidden = true;
    ui.download.hidden = true;
  }

  async function open() {
    if (exportAbort) return;
    const request = ++requestId;
    pause();
    current = snapshot();
    clearResult();
    const { width, height } = current.texture;
    ui.size.textContent = `${width} × ${height}`;
    format = null;
    ui.format.textContent = "检测编码能力…";
    ui.video.disabled = true;
    ui.status.textContent = "正在检测当前画幅的逐帧编码能力…";
    ui.progress.hidden = true;
    ui.dialog.showModal();
    try {
      const detected = await files.supportedVideo(width, height);
      if (request !== requestId || !ui.dialog.open) return;
      format = detected;
      ui.format.textContent = format ? `${format.label} · 逐帧编码` : "此浏览器不支持";
      ui.video.disabled = !format;
      ui.status.textContent = format
        ? `将生成 ${FRAME_COUNT} 帧、${FRAME_RATE} fps 的 ${DURATION_SECONDS} 秒视频。设备慢时耗时更长，不会跳帧。`
        : "此浏览器不支持逐帧视频编码，仍可导出 PNG。请尝试新版 Chrome 或 Edge。";
    } catch {
      if (request !== requestId || !ui.dialog.open) return;
      ui.format.textContent = "检测失败";
      ui.status.textContent = "编码模块未加载，请关闭后重试。PNG 仍可使用。";
    }
  }

  function close() {
    requestId += 1;
    exportAbort?.abort();
    clearResult();
    current = null;
    ui.open.focus();
  }

  async function savePng() {
    const request = requestId;
    const { texture } = current;
    ui.png.disabled = true;
    try {
      const blob = await files.pngBlob(texture.front);
      if (request !== requestId || !ui.dialog.open) return;
      files.downloadBlob(blob, "liangos-fold.png");
      ui.status.textContent = `PNG 已生成 · ${texture.width} × ${texture.height} · ${(blob.size / 1024).toFixed(0)} KB`;
    } catch (error) {
      if (request === requestId) ui.status.textContent = error.message;
    } finally {
      if (!exportAbort) ui.png.disabled = false;
    }
  }

  function showProgress(value, count) {
    ui.progress.value = value;
    ui.status.textContent =
      count === FRAME_COUNT
        ? `${FRAME_COUNT} 帧已绘制，正在完成编码和封装…`
        : `正在逐帧生成 ${count} / ${FRAME_COUNT}，请保持页面在前台…`;
  }

  async function saveVideo() {
    if (exportAbort || !format) return;
    const request = requestId;
    const selectedFormat = format;
    const { texture, amplitude } = current;
    const controller = new AbortController();
    exportAbort = controller;
    setBusy(true);
    clearResult();
    ui.video.disabled = true;
    ui.png.disabled = true;
    ui.progress.hidden = false;
    showProgress(0, 0);
    try {
      const result = await files.encodeVideo(
        texture,
        amplitude,
        selectedFormat,
        (value, count) => {
          if (request === requestId) showProgress(value, count);
        },
        controller.signal,
      );
      if (request !== requestId || controller.signal.aborted) return;
      resultUrl = URL.createObjectURL(result.blob);
      ui.result.src = resultUrl;
      ui.result.hidden = false;
      ui.download.href = resultUrl;
      ui.download.download = `liangos-fold.${selectedFormat.extension}`;
      ui.download.hidden = false;
      ui.download.textContent = `下载 ${selectedFormat.label} · ${(result.blob.size / 1024 / 1024).toFixed(1)} MB`;
      ui.status.textContent = `已完成 ${result.frameCount} 帧 · ${result.frameRate} fps · ${result.duration} 秒。可播放检查并下载。`;
    } catch (error) {
      if (request === requestId) ui.status.textContent = error.message;
    } finally {
      exportAbort = null;
      setBusy(false);
      ui.video.disabled = !format;
      ui.png.disabled = false;
      ui.progress.hidden = true;
      if (!ui.dialog.open) ui.open.focus();
    }
  }

  ui.open.addEventListener("click", open);
  ui.close.addEventListener("click", () => ui.dialog.close());
  ui.dialog.addEventListener("cancel", () => exportAbort?.abort());
  ui.dialog.addEventListener("close", close);
  ui.png.addEventListener("click", savePng);
  ui.video.addEventListener("click", saveVideo);
}
