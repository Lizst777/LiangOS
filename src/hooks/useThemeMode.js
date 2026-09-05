import { useEffect, useState } from "react";
import {
  applyTheme,
  getNextTheme,
  getStoredTheme,
  getSystemTheme,
  setStoredTheme,
} from "../utils/theme";

export function useThemeMode() {
  const [theme, setTheme] = useState(() => {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
    return storedTheme;
  });
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);

  useEffect(() => {
    setStoredTheme(theme);
    applyTheme(theme);

    if (theme !== "system") return undefined;

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return undefined;

    function handleSystemThemeChange() {
      setSystemTheme(getSystemTheme());
      applyTheme("system");
    }

    mediaQuery.addEventListener?.("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleSystemThemeChange);
    };
  }, [theme]);

  function toggleTheme() {
    const nextTheme = getNextTheme(theme);
    if (nextTheme === "system") setSystemTheme(getSystemTheme());
    setTheme(nextTheme);
  }

  return {
    resolvedTheme: theme === "system" ? systemTheme : theme,
    theme,
    toggleTheme,
  };
}
