import { useState } from "react";
import { NAV_ITEMS } from "../../constants/navigation";
import { getThemeLabel } from "../../utils/theme";
import {
  IconChevron,
  IconLogout,
  IconMonitor,
  IconMoon,
  IconSun,
  NavIcon,
} from "../../ui/Icons";

function ThemeIcon({ theme }) {
  if (theme === "light") return <IconSun />;
  if (theme === "dark") return <IconMoon />;
  return <IconMonitor />;
}

function Sidebar({ page, theme, onPageChange, onThemeToggle, onLogout }) {
  const [collapsed, setCollapsed] = useState(false);
  const sidebarClass = collapsed
    ? "sidebar hidden lg:flex sidebar--collapsed"
    : "sidebar hidden lg:flex";
  const themeLabel = getThemeLabel(theme);

  return (
    <aside className={sidebarClass}>
      <div className="sidebar__brand">
        <span className="sidebar__logo-mark">L</span>
        <span className="sidebar__logo-text">LiangOS</span>
      </div>

      <nav className="sidebar__nav" aria-label="主导航">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            type="button"
            className={
              page === item.id
                ? "sidebar__item sidebar__item--active"
                : "sidebar__item"
            }
            onClick={() => onPageChange(item.id)}
            title={collapsed ? item.label : undefined}
            aria-current={page === item.id ? "page" : undefined}
          >
            <span className="sidebar__item-icon">
              <NavIcon name={item.icon} />
            </span>
            <span className="sidebar__item-label">{item.label}</span>
          </button>
        ))}
      </nav>

      <div className="sidebar__footer">
        <button
          type="button"
          className="sidebar__collapse"
          onClick={() => setCollapsed((current) => !current)}
          aria-label={collapsed ? "展开侧栏" : "折叠侧栏"}
          title={collapsed ? "展开侧栏" : "折叠侧栏"}
        >
          <IconChevron direction={collapsed ? "right" : "left"} />
        </button>

        <button
          type="button"
          className="sidebar__action theme-cycle"
          onClick={onThemeToggle}
          title={`主题：${themeLabel}`}
          aria-label={`当前主题：${themeLabel}，点击切换`}
        >
          <ThemeIcon theme={theme} />
          <span className="sidebar__action-label">{themeLabel}</span>
        </button>

        <button
          type="button"
          className="sidebar__action"
          onClick={onLogout}
          title="退出登录"
        >
          <IconLogout />
          <span className="sidebar__action-label">退出登录</span>
        </button>
      </div>
    </aside>
  );
}

export default Sidebar;
