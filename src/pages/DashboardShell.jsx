import Sidebar from "../components/layout/Sidebar";
import MobileHeader from "../components/layout/MobileHeader";
import DashboardView from "./views/DashboardView";

function DashboardShell({ theme, onThemeToggle }) {
  return (
    <section className="app-shell app-shell--dashboard">
      <Sidebar theme={theme} onThemeToggle={onThemeToggle} />
      <main className="main main--dashboard">
        <MobileHeader theme={theme} onThemeToggle={onThemeToggle} />
        <div className="page-content page-content--dashboard page-content--active">
          <DashboardView />
        </div>
      </main>
    </section>
  );
}

export default DashboardShell;
