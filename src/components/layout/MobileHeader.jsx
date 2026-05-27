import { getPageMeta } from "../../constants/navigation";
import { getThemeLabel } from "../../utils/theme";
import { IconMonitor, IconMoon, IconSun } from "../../ui/Icons";

function ThemeIcon({ theme }) {
  if (theme === "light") return <IconSun />;
  if (theme === "dark") return <IconMoon />;
  return <IconMonitor />;
}

function MobileHeader({ page, theme, onThemeToggle }) {
  const meta = getPageMeta(page);
  const themeLabel = getThemeLabel(theme);

  return (
    <header className={`mobile-header mobile-header--${page}`}>
      <div className="mobile-header__copy">
        <span className="mobile-header__brand">LiangOS</span>
        <h1 className="mobile-header__title">{meta.title}</h1>
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
