import { useEffect } from "react";
import DashboardShell from "./pages/DashboardShell";
import { useThemeMode } from "./hooks/useThemeMode";

function App() {
  const { resolvedTheme, theme, toggleTheme } = useThemeMode();

  useEffect(() => {
    // Old Notes bookmarks now open the remaining home page.
    if (window.location.hash.toLowerCase() === "#notes") {
      window.history.replaceState(
        window.history.state,
        "",
        window.location.pathname + window.location.search,
      );
    }
  }, []);

  const shellClass = `liangos-app min-h-[100svh] min-h-[100dvh] overflow-x-hidden antialiased selection:bg-sky-500/20 ${
    resolvedTheme === "dark" ? "theme-dark" : "theme-light"
  }`;

  return (
    <div className={shellClass}>
      <DashboardShell theme={theme} onThemeToggle={toggleTheme} />
    </div>
  );
}

export default App;
