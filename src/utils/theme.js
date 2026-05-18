const THEME_STORAGE_KEY = "liangos-theme";
const THEMES = new Set(["system", "light", "dark"]);

export function getStoredTheme() {
  try {
    const theme = localStorage.getItem(THEME_STORAGE_KEY);
    return THEMES.has(theme) ? theme : "system";
  } catch {
    return "system";
  }
}

export function setStoredTheme(theme) {
  const nextTheme = THEMES.has(theme) ? theme : "system";

  try {
    localStorage.setItem(THEME_STORAGE_KEY, nextTheme);
  } catch {
    /* ignore */
  }
}

export function getSystemTheme() {
  if (
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-color-scheme: dark)").matches
  ) {
    return "dark";
  }

  return "light";
}

export function applyTheme(theme) {
  const mode = THEMES.has(theme) ? theme : "system";
  const resolvedTheme = mode === "system" ? getSystemTheme() : mode;

  if (typeof document !== "undefined") {
    document.documentElement.dataset.theme = resolvedTheme;
    document.documentElement.dataset.themeMode = mode;
  }

  return resolvedTheme;
}

export function getNextTheme(theme) {
  if (theme === "system") return "light";
  if (theme === "light") return "dark";
  return "system";
}

export function getThemeLabel(theme) {
  if (theme === "light") return "浅色";
  if (theme === "dark") return "深色";
  return "跟随";
}
