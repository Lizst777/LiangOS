const RECENT_TOOLS_STORAGE_KEY = "liangos-tools-recent";
const MAX_RECENT_TOOLS = 3;

export function loadRecentToolIds() {
  try {
    const raw = localStorage.getItem(RECENT_TOOLS_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.slice(0, MAX_RECENT_TOOLS) : [];
  } catch {
    return [];
  }
}

export function saveRecentToolIds(ids) {
  try {
    localStorage.setItem(
      RECENT_TOOLS_STORAGE_KEY,
      JSON.stringify(ids.slice(0, MAX_RECENT_TOOLS)),
    );
  } catch {
    /* ignore quota / private mode */
  }
}

export function recordRecentTool(id, currentIds) {
  const next = [id, ...currentIds.filter((toolId) => toolId !== id)].slice(
    0,
    MAX_RECENT_TOOLS,
  );
  saveRecentToolIds(next);
  return next;
}
