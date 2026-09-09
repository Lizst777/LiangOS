import ThemeIcon from "../../ui/ThemeIcon";
import { getThemeLabel } from "../../utils/theme";

function MobileHeader({ theme, onThemeToggle }) {
  const themeLabel = getThemeLabel(theme);

  return (
    <header className="mobile-header mobile-header--dashboard">
      <button
        type="button"
        className="mobile-header__theme theme-cycle"
        onClick={onThemeToggle}
        aria-label={`Current theme: ${themeLabel}. Switch theme.`}
        title={`Theme: ${themeLabel}`}
      >
        <ThemeIcon theme={theme} />
        <span>{themeLabel}</span>
      </button>
    </header>
  );
}

export default MobileHeader;
