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
  resolvedTheme,
  onThemeToggle,
  onPageChange,
  registerBeforePageChange,
}) {
  useEffect(() => {
    void loadNotesView().catch(() => {});
  }, []);

  function renderView() {
    switch (currentPage) {
      case "notes":
        return (
          <Suspense
            fallback={
              <section className="page-loading" aria-label="Notes loading">
                <ConnectionStatus />
              </section>
            }
          >
            <NotesView registerBeforeLeave={registerBeforePageChange} />
          </Suspense>
        );
      default:
        return <DashboardView />;
    }
  }

  return (
    <section className={`app-shell app-shell--${currentPage}`}>
      <Sidebar
        page={currentPage}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onPageChange={onPageChange}
        onThemeToggle={onThemeToggle}
      />
      <main className={`main main--${currentPage}`}>
        <MobileHeader page={currentPage} theme={theme} onThemeToggle={onThemeToggle} />
        <PageHeader page={currentPage} />
        <PageTransition pageKey={currentPage}>{renderView()}</PageTransition>
      </main>
      <BottomNavigation page={currentPage} onPageChange={onPageChange} />
    </section>
  );
}

export default DashboardShell;
