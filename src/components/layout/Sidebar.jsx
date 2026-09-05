import { getNavigationDestination } from "../../constants/navigation";
import { NavIcon } from "../../ui/Icons";
import ThemeIcon from "../../ui/ThemeIcon";
import { getThemeLabel } from "../../utils/theme";

function Sidebar({ page, theme, onPageChange, onThemeToggle }) {
  const destination = getNavigationDestination(page);
  const themeLabel = getThemeLabel(theme);

  return (
    <aside className="sidebar hidden lg:flex" aria-label="Workspace navigation">
      <nav className="sidebar__nav" aria-label="Workspace navigation">
        <button
          type="button"
          className="sidebar__item"
          onClick={() => onPageChange(destination.id)}
          aria-label={destination.label}
        >
          <span className="sidebar__item-icon">
            <NavIcon name={destination.icon} />
          </span>
          <span className="sidebar__tooltip" aria-hidden="true">
            {destination.label}
          </span>
        </button>
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__action"
          onClick={onThemeToggle}
          aria-label={`Current theme: ${themeLabel}. Switch theme.`}
        >
          <ThemeIcon theme={theme} />
          <span className="sidebar__tooltip" aria-hidden="true">
            Theme · {themeLabel}
          </span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
