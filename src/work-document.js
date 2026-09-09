export const DEFAULT_DOCUMENT = Object.freeze({
  title: "STILL",
  subtitle: "让这一刻，慢一点。",
  credit: "VOL. 01 / 2026",
  paper: "#f4f0e7",
  ratio: "3:4",
  amplitude: 0.65,
  zoom: 1,
  cropX: 0,
  cropY: 0,
  imageBlob: null,
});

const TEXT_LIMITS = { title: 32, subtitle: 64, credit: 48 };
const NUMBER_LIMITS = {
  amplitude: [0, 1],
  zoom: [1, 2.5],
  cropX: [-1, 1],
  cropY: [-1, 1],
};

/** Drafts contain plain content and a Blob, never a bitmap, DOM node or animation state. */
export function readDocument(value) {
  if (!value || typeof value !== "object") throw new Error("草稿内容无法读取。");
  const result = { ...DEFAULT_DOCUMENT };
  for (const [key, limit] of Object.entries(TEXT_LIMITS)) {
    if (typeof value[key] !== "string" || value[key].length > limit)
      throw new Error("草稿文字格式不正确。");
    result[key] = value[key];
  }
  if (
    !["3:4", "1:1", "9:16"].includes(value.ratio) ||
    !["#f4f0e7", "#e5ddd0", "#dce2de"].includes(value.paper)
  )
    throw new Error("草稿样式无法识别。");
  result.ratio = value.ratio;
  result.paper = value.paper;
  for (const [key, [min, max]] of Object.entries(NUMBER_LIMITS)) {
    if (!Number.isFinite(value[key]) || value[key] < min || value[key] > max)
      throw new Error("草稿参数不正确。");
    result[key] = value[key];
  }
  if (value.imageBlob !== null && !(value.imageBlob instanceof Blob))
    throw new Error("草稿图片无法读取。");
  if (
    value.imageBlob &&
    (value.imageBlob.size > 15 * 1024 * 1024 ||
      !/^image\/(jpeg|png|webp|avif)$/.test(value.imageBlob.type))
  ) {
    throw new Error("草稿图片格式不正确。");
  }
  result.imageBlob = value.imageBlob;
  return result;
}

export function sameDocument(a, b) {
  return Object.keys(DEFAULT_DOCUMENT).every((key) => a[key] === b[key]);
}

/** Bounded history shares Blob references; a gesture can explicitly end its group. */
export function createHistory(
  initial,
  { limit = 40, imageBudget = 64 * 1024 * 1024 } = {},
) {
  let entries = [{ ...initial }];
  let cursor = 0;
  let group = null;
  let lastAt = 0;
  function imageBytes() {
    return [...new Set(entries.map((entry) => entry.imageBlob).filter(Boolean))].reduce(
      (total, blob) => total + blob.size,
      0,
    );
  }
  return {
    get current() {
      return { ...entries[cursor] };
    },
    get canUndo() {
      return cursor > 0;
    },
    get canRedo() {
      return cursor < entries.length - 1;
    },
    peek(direction) {
      const entry = entries[cursor + direction];
      return entry ? { ...entry } : null;
    },
    endGroup() {
      group = null;
    },
    commit(next, nextGroup = null, now = Date.now()) {
      if (sameDocument(entries[cursor], next)) return false;
      const merge =
        nextGroup &&
        nextGroup === group &&
        (nextGroup.startsWith("gesture:") || now - lastAt < 700) &&
        cursor > 0;
      entries = entries.slice(0, cursor + 1);
      if (merge) entries[cursor] = { ...next };
      else {
        entries.push({ ...next });
        cursor += 1;
      }
      group = nextGroup;
      lastAt = now;
      while (
        entries.length > 1 &&
        (entries.length > limit || imageBytes() > imageBudget)
      ) {
        entries.shift();
        cursor -= 1;
      }
      return true;
    },
    move(direction) {
      if (!entries[cursor + direction]) return null;
      cursor += direction;
      group = null;
      return this.current;
    },
  };
}
