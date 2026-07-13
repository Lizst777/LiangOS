import { useEffect, useState } from "react";
import DashboardShell from "./pages/DashboardShell";
import {
  applyTheme,
  getNextTheme,
  getStoredTheme,
  getSystemTheme,
  setStoredTheme,
} from "./utils/theme";

const PAGE_BY_HASH = {
  "#notes": "notes",
};

function getPageFromLocation() {
  return PAGE_BY_HASH[window.location.hash.toLowerCase()] ?? "dashboard";
}

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromLocation);
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

  useEffect(() => {
    function syncPageFromHistory() {
      setCurrentPage(getPageFromLocation());
    }

    window.addEventListener("popstate", syncPageFromHistory);
    return () => window.removeEventListener("popstate", syncPageFromHistory);
  }, []);

  function toggleTheme() {
    const nextTheme = getNextTheme(theme);

    if (nextTheme === "system") {
      setSystemTheme(getSystemTheme());
    }

    setTheme(nextTheme);
  }

  function navigateToPage(page) {
    const nextPage = page === "notes" ? "notes" : "dashboard";
    const nextHash = nextPage === "notes" ? "#notes" : "";
    const nextUrl = `${window.location.pathname}${window.location.search}${nextHash}`;

    if (window.location.hash !== nextHash) {
      window.history.pushState({}, "", nextUrl);
    }

    setCurrentPage(nextPage);
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
        onPageChange={navigateToPage}
      />
    </div>
  );
}

export default App;
