import { IconMonitor, IconMoon, IconSun } from "./Icons";

function ThemeIcon({ theme }) {
  if (theme === "light") return <IconSun />;
  if (theme === "dark") return <IconMoon />;
  return <IconMonitor />;
}

export default ThemeIcon;
