import { useCallback, useEffect, useRef, useState } from "react";

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

export function usePageNavigation() {
  const [currentPage, setCurrentPage] = useState(getPageFromLocation);
  const currentPageRef = useRef(currentPage);
  const beforePageChangeRef = useRef(null);
  const navigationPendingRef = useRef(false);

  useEffect(() => {
    currentPageRef.current = currentPage;
  }, [currentPage]);

  const registerBeforePageChange = useCallback((guard) => {
    beforePageChangeRef.current = guard;

    return () => {
      if (beforePageChangeRef.current === guard) {
        beforePageChangeRef.current = null;
      }
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

  const navigateToPage = useCallback(
    (page) => transitionToPage(page),
    [transitionToPage],
  );

  return {
    currentPage,
    navigateToPage,
    registerBeforePageChange,
  };
}
