import { NAV_ITEMS } from "../../constants/navigation";
import { IconMoon, IconSun, IconMonitor } from "../../ui/Icons";

const EDITORIAL_LABELS = {
  dashboard: "Overview",
  search: "Search",
  tools: "Tools",
  music: "Music",
  notes: "Notes",
};

function ThemeIcon({ theme }) {
  if (theme === "light") return <IconSun />;
  if (theme === "dark") return <IconMoon />;
  return <IconMonitor />;
}

function Sidebar({ page, theme, onPageChange, onThemeToggle }) {
  return (
    <aside className="sidebar hidden lg:flex" aria-label="Workspace navigation">
      <nav className="sidebar__nav" aria-label="Workspace navigation">
        {NAV_ITEMS.map((item) => {
          const label = EDITORIAL_LABELS[item.id] ?? item.label;

          return (
            <button
              key={item.id}
              type="button"
              className={
                page === item.id
                  ? "sidebar__item sidebar__item--active"
                  : "sidebar__item"
              }
              onClick={() => onPageChange(item.id)}
              aria-current={page === item.id ? "page" : undefined}
              title={label}
            >
              <span className="sidebar__item-label">{label}</span>
            </button>
          );
        })}
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
