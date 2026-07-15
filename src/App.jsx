import { useCallback, useEffect, useRef, useState } from "react";
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

function getUrlForPage(page) {
  const hash = page === "notes" ? "#notes" : "";
  return `${window.location.pathname}${window.location.search}${hash}`;
}

function App() {
  const [currentPage, setCurrentPage] = useState(getPageFromLocation);
  const currentPageRef = useRef(currentPage);
  const beforePageChangeRef = useRef(null);
  const navigationPendingRef = useRef(false);
  const [theme, setTheme] = useState(() => {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
    return storedTheme;
  });
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

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

  const registerBeforePageChange = useCallback((guard) => {
    beforePageChangeRef.current = guard;

    return () => {
      if (beforePageChangeRef.current === guard) beforePageChangeRef.current = null;
    };
  }, []);

  const transitionToPage = useCallback(async (page, { updateHistory = true } = {}) => {
    const nextPage = page === "notes" ? "notes" : "dashboard";
    if (nextPage === currentPageRef.current) return true;
    if (navigationPendingRef.current) return false;

    navigationPendingRef.current = true;

    try {
      const canLeave = beforePageChangeRef.current
        ? await beforePageChangeRef.current()
        : true;

      if (!canLeave) {
        if (!updateHistory) {
          window.history.replaceState({}, "", getUrlForPage(currentPageRef.current));
        }
        return false;
      }

      if (updateHistory) {
        window.history.pushState({}, "", getUrlForPage(nextPage));
      }

      currentPageRef.current = nextPage;
      setCurrentPage(nextPage);
      return true;
    } catch {
      if (!updateHistory) {
        window.history.replaceState({}, "", getUrlForPage(currentPageRef.current));
      }
      return false;
    } finally {
      navigationPendingRef.current = false;
    }
  }, []);

  useEffect(() => {
    function syncPageFromHistory() {
      void transitionToPage(getPageFromLocation(), { updateHistory: false });
    }

    window.addEventListener("popstate", syncPageFromHistory);
    window.addEventListener("hashchange", syncPageFromHistory);

    return () => {
      window.removeEventListener("popstate", syncPageFromHistory);
      window.removeEventListener("hashchange", syncPageFromHistory);
    };
  }, [transitionToPage]);

  function toggleTheme() {
    const nextTheme = getNextTheme(theme);

    if (nextTheme === "system") {
      setSystemTheme(getSystemTheme());
    }

    setTheme(nextTheme);
  }

  const navigateToPage = useCallback(
    (page) => transitionToPage(page),
    [transitionToPage],
  );

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
        registerBeforePageChange={registerBeforePageChange}
      />
    </div>
  );
}

export default App;
