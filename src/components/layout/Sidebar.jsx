import { NAV_ITEMS } from "../../constants/navigation";
import { IconMoon, IconSun, IconMonitor, NavIcon } from "../../ui/Icons";

function ThemeIcon({ theme }) {
  if (theme === "light") return <IconSun />;
  if (theme === "dark") return <IconMoon />;
  return <IconMonitor />;
}

function Sidebar({ page, theme, onPageChange, onThemeToggle }) {
  const destination = NAV_ITEMS.find((item) => item.id !== page) ?? NAV_ITEMS[0];

  return (
    <aside className="sidebar hidden lg:flex" aria-label="Workspace navigation">
      <nav className="sidebar__nav" aria-label="Workspace navigation">
        <button
          type="button"
          className="sidebar__item"
          onClick={() => onPageChange(destination.id)}
          aria-label={destination.label}
          title={destination.label}
        >
          <span className="sidebar__item-icon">
            <NavIcon name={destination.icon} />
          </span>
        </button>
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__action"
          onClick={onThemeToggle}
          title="Theme"
          aria-label="Toggle theme"
        >
          <ThemeIcon theme={theme} />
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
