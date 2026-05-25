import { useEffect, useState } from "react";
import DashboardShell from "./pages/DashboardShell";
import {
  applyTheme,
  getNextTheme,
  getStoredTheme,
  getSystemTheme,
  setStoredTheme,
} from "./utils/theme";

function App() {
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [theme, setTheme] = useState(() => {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
    return storedTheme;
  });
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

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

    if (nextTheme === "system") {
      setSystemTheme(getSystemTheme());
    }

    setTheme(nextTheme);
  }

  const shellClass = `liangos-app min-h-[100svh] min-h-[100dvh] overflow-x-hidden antialiased selection:bg-sky-500/20 ${
    resolvedTheme === "dark" ? "theme-dark" : "theme-light"
  }`;

  return (
    <div className={shellClass}>
      <DashboardShell
        currentPage={currentPage}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onThemeToggle={toggleTheme}
        onPageChange={setCurrentPage}
      />
    </div>
  );
}

export default App;
