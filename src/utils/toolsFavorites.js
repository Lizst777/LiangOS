const FAVORITES_STORAGE_KEY = "liangos-tools-favorites";

/** 从 localStorage 读取收藏的工具 id 列表 */
export function loadFavoriteIds() {
  try {
    const raw = localStorage.getItem(FAVORITES_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

/** 将收藏 id 列表写入 localStorage */
export function saveFavoriteIds(ids) {
  try {
    localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* ignore quota / private mode */
  }
}

export function toggleFavoriteId(id, currentIds) {
  const set = new Set(currentIds);
  if (set.has(id)) {
    set.delete(id);
  } else {
    set.add(id);
  }
  const next = [...set];
  saveFavoriteIds(next);
  return next;
}

export function isFavorite(id, favoriteIds) {
  return favoriteIds.includes(id);
}
