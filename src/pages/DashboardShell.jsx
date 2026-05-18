import PageHeader from "../components/layout/PageHeader";
import PageTransition from "../components/layout/PageTransition";
import Sidebar from "../components/layout/Sidebar";
import BottomNavigation from "../components/layout/BottomNavigation";
import MobileHeader from "../components/layout/MobileHeader";
import DashboardView from "./views/DashboardView";
import NotesView from "./views/NotesView";
import SearchView from "./views/SearchView";
import ToolsView from "./views/ToolsView";
import Music from "./Music";
import StatusView from "./views/StatusView";

function DashboardShell({
  username,
  currentPage,
  theme,
  resolvedTheme,
  onThemeToggle,
  onPageChange,
  onLogout,
}) {
  function renderView() {
    switch (currentPage) {
      case "search":
        return <SearchView />;
      case "tools":
        return <ToolsView />;
      case "music":
        return <Music />;
      case "notes":
        return <NotesView />;
      case "status":
        return <StatusView />;
      default:
        return <DashboardView theme={theme} />;
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
        onLogout={onLogout}
      />
      <main className="main">
        <MobileHeader page={currentPage} theme={theme} onThemeToggle={onThemeToggle} />
        <PageHeader page={currentPage} username={username} />
        <PageTransition pageKey={currentPage}>{renderView()}</PageTransition>
      </main>
      <BottomNavigation page={currentPage} onPageChange={onPageChange} />
    </section>
  );
}

export default DashboardShell;
