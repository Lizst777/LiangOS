/** Fit a short caption inside a fixed band without silently dropping text. */
export function layoutCaption(ctx, text, { width, size, family, maxLines = 2 }) {
  const tokens = String(text).match(/[A-Za-z0-9]+|\s+|[^\s]/gu) ?? [];
  let lines = [];
  for (let current = size; current >= 1; current -= 1) {
    ctx.font = `${current}px ${family}`;
    lines = [];
    let line = "";
    for (const token of tokens) {
      // Split only words that cannot fit on a complete line.
      const parts = ctx.measureText(token).width > width ? [...token] : [token];
      for (const part of parts) {
        if (line && ctx.measureText(line + part).width > width) {
          lines.push(line.trimEnd());
          line = "";
        }
        if (line || part.trim()) line += part;
      }
    }
    if (line.trim()) lines.push(line.trimEnd());
    if (lines.length <= maxLines) return { lines, size: current };
  }
  return { lines, size: 1 };
}
