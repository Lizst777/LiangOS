import PageHeader from "../components/layout/PageHeader";
import PageTransition from "../components/layout/PageTransition";
import Sidebar from "../components/layout/Sidebar";
import BottomNavigation from "../components/layout/BottomNavigation";
import MobileHeader from "../components/layout/MobileHeader";
import DashboardView from "./views/DashboardView";
import NotesView from "./views/NotesView";

function DashboardShell({
  currentPage,
  theme,
  resolvedTheme,
  onThemeToggle,
  onPageChange,
}) {
  function renderView() {
    switch (currentPage) {
      case "notes":
        return <NotesView />;
      default:
        return <DashboardView onOpenNotes={() => onPageChange("notes")} />;
    }
  }

  return (
    <section className="app-shell">
      <Sidebar
        page={currentPage}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onPageChange={onPageChange}
        onThemeToggle={onThemeToggle}
      />
      <main className="main">
        <MobileHeader page={currentPage} theme={theme} onThemeToggle={onThemeToggle} />
        <PageHeader page={currentPage} />
        <PageTransition pageKey={currentPage}>{renderView()}</PageTransition>
      </main>
      <BottomNavigation page={currentPage} onPageChange={onPageChange} />
    </section>
  );
}

export default DashboardShell;
