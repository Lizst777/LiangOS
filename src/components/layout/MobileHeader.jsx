import { getNavigationPage } from "../../constants/navigation";
import ThemeIcon from "../../ui/ThemeIcon";
import { getThemeLabel } from "../../utils/theme";

function MobileHeader({ page, theme, onThemeToggle }) {
  const currentPage = getNavigationPage(page);
  const themeLabel = getThemeLabel(theme);

  return (
    <header className={`mobile-header mobile-header--${page}`}>
      <div className="mobile-header__copy">
        <span className="mobile-header__brand">LiangOS</span>
        <h1 className="mobile-header__title">{currentPage.label}</h1>
      </div>
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
