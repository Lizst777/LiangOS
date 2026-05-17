import PageHeader from "../components/layout/PageHeader";
import PageTransition from "../components/layout/PageTransition";
import Sidebar from "../components/layout/Sidebar";
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
        onPageChange={onPageChange}
        onThemeToggle={onThemeToggle}
        onLogout={onLogout}
      />
      <main className="main">
        <PageHeader page={currentPage} username={username} />
        <PageTransition pageKey={currentPage}>{renderView()}</PageTransition>
      </main>
    </section>
  );
}

export default DashboardShell;
