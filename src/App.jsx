import DashboardShell from "./pages/DashboardShell";
import { usePageNavigation } from "./hooks/usePageNavigation";
import { useThemeMode } from "./hooks/useThemeMode";

function App() {
  const { currentPage, navigateToPage, registerBeforePageChange } = usePageNavigation();
  const { resolvedTheme, theme, toggleTheme } = useThemeMode();

  const shellClass = `liangos-app min-h-[100svh] min-h-[100dvh] overflow-x-hidden antialiased selection:bg-sky-500/20 ${
    resolvedTheme === "dark" ? "theme-dark" : "theme-light"
  }`;

  return (
    <div className={shellClass}>
      <DashboardShell
        currentPage={currentPage}
        theme={theme}
        onPageChange={navigateToPage}
        onThemeToggle={toggleTheme}
        registerBeforePageChange={registerBeforePageChange}
      />
    </div>
  );
}

export default App;
