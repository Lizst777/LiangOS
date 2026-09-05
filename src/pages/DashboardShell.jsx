import { lazy, Suspense, useEffect } from "react";
import PageHeader from "../components/layout/PageHeader";
import PageTransition from "../components/layout/PageTransition";
import Sidebar from "../components/layout/Sidebar";
import BottomNavigation from "../components/layout/BottomNavigation";
import MobileHeader from "../components/layout/MobileHeader";
import ConnectionStatus from "../ui/ConnectionStatus";
import DashboardView from "./views/DashboardView";

const loadNotesView = () => import("./views/NotesView");
const NotesView = lazy(loadNotesView);

function DashboardShell({
  currentPage,
  theme,
  onThemeToggle,
  onPageChange,
  registerBeforePageChange,
}) {
  useEffect(() => {
    const preloadNotes = () => void loadNotesView();
    const idleId = window.requestIdleCallback?.(preloadNotes, { timeout: 1600 });
    const timeoutId =
      idleId === undefined ? window.setTimeout(preloadNotes, 900) : null;

    return () => {
      if (idleId !== undefined) window.cancelIdleCallback?.(idleId);
      if (timeoutId !== null) window.clearTimeout(timeoutId);
    };
  }, []);

  return (
    <section className={`app-shell app-shell--${currentPage}`}>
      <Sidebar
        page={currentPage}
        theme={theme}
        onPageChange={onPageChange}
        onThemeToggle={onThemeToggle}
      />
      <main className={`main main--${currentPage}`}>
        <MobileHeader page={currentPage} theme={theme} onThemeToggle={onThemeToggle} />
        <PageHeader page={currentPage} />
        <PageTransition pageKey="dashboard" isActive={currentPage === "dashboard"}>
          <DashboardView />
        </PageTransition>
        <PageTransition pageKey="notes" isActive={currentPage === "notes"}>
          <Suspense
            fallback={
              <section className="page-loading" aria-label="Notes loading">
                <ConnectionStatus />
              </section>
            }
          >
            <NotesView
              isActive={currentPage === "notes"}
              registerBeforeLeave={registerBeforePageChange}
            />
          </Suspense>
        </PageTransition>
      </main>
      <BottomNavigation page={currentPage} onPageChange={onPageChange} />
    </section>
  );
}

export default DashboardShell;
