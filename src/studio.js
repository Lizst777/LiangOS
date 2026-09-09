import { clamp } from "./geometry.js";
import { createPreview } from "./preview-controller.js";
import { createExportDialog } from "./export-dialog.js";
import { DEFAULT_DOCUMENT } from "./work-document.js";
import { createDraftStore } from "./draft-store.js";
import { createDocumentSession } from "./document-session.js";
import { prepareImage } from "./image-resource.js";
import { createDetailViewer } from "./detail-viewer.js";
import {
  COMPACT_EDITOR,
  createEditorPanels,
  trackEditorViewport,
} from "./editor-panels.js";

const get = (id) => document.getElementById(id);
const canvas = get("preview");
const state = { ...DEFAULT_DOCUMENT, image: null };
let loadedImage;
let exporting = false;
let toastTimer;
let drag = null;
const stages = [...document.querySelectorAll("[data-stage]")];
const preview = createPreview(
  {
    canvas,
    play: get("play"),
    stages,
    mode: get("preview-mode"),
    scrubber: get("progress"),
    time: get("time"),
  },
  state,
);

function announce(message) {
  clearTimeout(toastTimer);
  get("status").textContent = message;
  toastTimer = setTimeout(() => {
    get("status").textContent = "";
  }, 5000);
}

function syncAvailability() {
  const locked = session.busy || exporting;
  get("editor").disabled = locked;
  get("open-export").disabled = locked;
  get("open-detail").disabled = locked;
  get("new-work").disabled = locked;
  get("undo").disabled = locked || !session.canUndo;
  get("redo").disabled = locked || !session.canRedo;
  if (locked) drag = null;
}

function syncForm() {
  for (const key of ["title", "subtitle", "credit", "zoom", "amplitude"]) {
    if (get(key).value !== String(state[key])) get(key).value = state[key];
  }
  for (const key of ["zoom", "amplitude"])
    get(`${key}-value`).value = `${Math.round(state[key] * 100)}%`;
  for (const key of ["ratio", "paper"]) {
    document.querySelectorAll(`[data-${key}]`).forEach((button) => {
      button.setAttribute("aria-pressed", String(button.dataset[key] === state[key]));
    });
  }
}

function renderDocument(document) {
  preview.beginEdit();
  Object.assign(state, document);
  syncForm();
  preview.rebuild();
}

async function applyDocument(document) {
  if (loadedImage !== document.imageBlob) {
    const resource = await prepareImage(document.imageBlob, get("thumbnail"));
    const previous = state.image;
    state.image = resource.bitmap;
    loadedImage = document.imageBlob;
    get("thumbnail").replaceWith(resource.thumbnail);
    previous?.close();
  }
  renderDocument(document);
}

const session = createDocumentSession({
  store: createDraftStore(),
  apply: applyDocument,
  render: renderDocument,
  onChange: syncAvailability,
  onStatus(status, error) {
    const labels = {
      empty: "更改后自动保存到本机",
      saving: "正在保存…",
      saved: "草稿已保存到本机",
      restored: "已恢复本机草稿",
      error: "草稿未保存 · 再修改时重试",
      unavailable: "无法恢复或保存草稿 · 请重新打开页面",
    };
    get("draft-status").textContent =
      error?.name === "DraftConflictError" ? "草稿冲突 · 请导出后刷新" : labels[status];
    get("draft-status").dataset.state = status;
    get("draft-status").title = error?.message ?? "";
    if (error) announce(error.message || "本机存储不可用，请先导出作品。");
  },
  onError: (error) => announce(error.message || "操作未完成，当前作品已保留。"),
});

createEditorPanels({
  tabs: get("editor-tabs"),
  panels: [...document.querySelectorAll(".editor-pane")],
  scroller: get("inspector-scroll"),
  help: get("inspector-help"),
  media: matchMedia(COMPACT_EDITOR),
  onSwitch: () => session.endGroup(),
});
trackEditorViewport(document.documentElement);

createDetailViewer(
  {
    dialog: get("detail-dialog"),
    open: get("open-detail"),
    close: get("close-detail"),
    front: get("detail-front"),
    back: get("detail-back"),
    zoom: get("detail-zoom"),
    scroller: get("detail-scroll"),
    canvas: get("detail-canvas"),
  },
  { snapshot: preview.snapshot, pause: preview.pause },
);

createExportDialog(
  {
    dialog: get("export-dialog"),
    open: get("open-export"),
    close: get("close-export"),
    result: get("export-result"),
    download: get("download-video"),
    size: get("export-size"),
    format: get("export-format"),
    video: get("export-video"),
    png: get("export-png"),
    status: get("export-status"),
    progress: get("export-progress"),
  },
  {
    snapshot: preview.snapshot,
    pause: preview.pause,
    setBusy(value) {
      exporting = value;
      session.endGroup();
      syncAvailability();
    },
  },
);

// History acts on the document, never on the preview clock or export state.
function travel(direction) {
  if (exporting || session.busy || document.querySelector("dialog[open]")) return;
  void session.travel(direction);
}
get("undo").addEventListener("click", () => travel(-1));
get("redo").addEventListener("click", () => travel(1));
document.addEventListener("keydown", (event) => {
  if (event.isComposing || !(event.ctrlKey || event.metaKey) || event.altKey) return;
  const key = event.key.toLowerCase();
  if (key !== "z" && key !== "y") return;
  if (document.querySelector("dialog[open]")) return;
  event.preventDefault();
  travel(key === "y" || event.shiftKey ? 1 : -1);
});
get("editor").addEventListener("beforeinput", (event) => {
  if (!["historyUndo", "historyRedo"].includes(event.inputType)) return;
  event.preventDefault();
  travel(event.inputType === "historyUndo" ? -1 : 1);
});

const newDialog = get("new-dialog");
get("new-work").addEventListener("click", () => {
  preview.pause();
  newDialog.showModal();
});
get("cancel-new").addEventListener("click", () => newDialog.close());
get("confirm-new").addEventListener("click", async () => {
  newDialog.close();
  await session.newDocument();
});
newDialog.addEventListener("close", () => get("new-work").focus());

// Playback controls delegate all animation state to the preview.
get("play").addEventListener("click", preview.toggle);
for (const button of stages)
  button.addEventListener("click", () => preview.seek(Number(button.dataset.stage)));
get("restart").addEventListener("click", () => {
  preview.seek(0);
  preview.start();
});
get("progress").addEventListener("input", (event) =>
  preview.seek(Number(event.target.value)),
);
document.addEventListener("visibilitychange", () => {
  if (document.hidden) {
    preview.pause();
    session.endGroup();
    void session.flush();
  }
});
window.addEventListener("beforeunload", (event) => {
  if (!session.dirty && !session.busy) return;
  event.preventDefault();
  event.returnValue = "";
});

// Continuous typing is one short history group; gestures finish on release.
for (const key of ["title", "subtitle", "credit"]) {
  get(key).addEventListener("input", (event) =>
    session.change({ [key]: event.target.value }, key),
  );
  get(key).addEventListener("blur", () => session.endGroup());
}
for (const key of ["zoom", "amplitude"]) {
  get(key).addEventListener("pointerdown", () => session.endGroup());
  get(key).addEventListener("input", (event) => {
    session.change({ [key]: Number(event.target.value) }, `gesture:${key}`);
    if (key === "amplitude") preview.updateAmplitude();
  });
  get(key).addEventListener("change", () => session.endGroup());
}
get("reset-crop").addEventListener("click", () =>
  session.change({ cropX: 0, cropY: 0, zoom: 1 }),
);
for (const key of ["ratio", "paper"]) {
  document.querySelectorAll(`[data-${key}]`).forEach((button) => {
    button.addEventListener("click", () =>
      session.change({ [key]: button.dataset[key] }),
    );
  });
}
get("image-file").addEventListener("change", async (event) => {
  const file = event.target.files[0];
  event.target.value = "";
  if (!file) return;
  if (file.size > 15 * 1024 * 1024) return announce("请选择小于 15 MB 的图片。");
  if (!/^image\/(jpeg|png|webp|avif)$/.test(file.type))
    return announce("请选择 JPG、PNG、WebP 或 AVIF 图片。");
  await session.replaceImage(file);
});

canvas.addEventListener("pointerdown", (event) => {
  if (exporting || session.busy || !preview.snapshot().texture) return;
  session.endGroup();
  preview.beginEdit();
  drag = { x: event.clientX, y: event.clientY, cropX: state.cropX, cropY: state.cropY };
  canvas.setPointerCapture(event.pointerId);
});
canvas.addEventListener("pointermove", (event) => {
  if (!drag) return;
  const rect = canvas.getBoundingClientRect();
  session.change(
    {
      cropX: clamp(drag.cropX - ((event.clientX - drag.x) / rect.width) * 4, -1, 1),
      cropY: clamp(drag.cropY - ((event.clientY - drag.y) / rect.height) * 4, -1, 1),
    },
    "gesture:crop",
  );
});
for (const event of ["pointerup", "pointercancel", "lostpointercapture"]) {
  canvas.addEventListener(event, () => {
    drag = null;
    session.endGroup();
  });
}

async function initialize() {
  await document.fonts.ready;
  const restored = await session.initialize();
  get("loading").hidden = true;
  get("play").disabled = false;
  get("restart").disabled = false;
  preview.seek(0.45);
  if (!restored && !matchMedia("(prefers-reduced-motion: reduce)").matches) {
    preview.seek(0);
    preview.start();
  }
}
void initialize();
