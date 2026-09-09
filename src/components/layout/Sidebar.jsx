import ThemeIcon from "../../ui/ThemeIcon";
import { getThemeLabel } from "../../utils/theme";

function Sidebar({ theme, onThemeToggle }) {
  const themeLabel = getThemeLabel(theme);

  return (
    <aside className="sidebar hidden lg:flex" aria-label="Appearance">
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
