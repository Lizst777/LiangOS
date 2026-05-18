import { useEffect, useState } from "react";
import DashboardShell from "./pages/DashboardShell";
import LoginPage from "./pages/LoginPage";
import {
  applyTheme,
  getNextTheme,
  getStoredTheme,
  getSystemTheme,
  setStoredTheme,
} from "./utils/theme";

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState(() => {
    const storedTheme = getStoredTheme();
    applyTheme(storedTheme);
    return storedTheme;
  });
  const [systemTheme, setSystemTheme] = useState(getSystemTheme);
  const resolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    setStoredTheme(theme);
    applyTheme(theme);

    if (theme !== "system") return undefined;

    const mediaQuery = window.matchMedia?.("(prefers-color-scheme: dark)");
    if (!mediaQuery) return undefined;

    function handleSystemThemeChange() {
      setSystemTheme(getSystemTheme());
      applyTheme("system");
    }

    mediaQuery.addEventListener?.("change", handleSystemThemeChange);

    return () => {
      mediaQuery.removeEventListener?.("change", handleSystemThemeChange);
    };
  }, [theme]);

  function toggleTheme() {
    const nextTheme = getNextTheme(theme);

    if (nextTheme === "system") {
      setSystemTheme(getSystemTheme());
    }

    setTheme(nextTheme);
  }

  function login() {
    if (username === "liang" && password === "123456") {
      setIsLogin(true);
      setMessage("");
    } else {
      setMessage("账号或密码错误");
    }
  }

  function logout() {
    setIsLogin(false);
    setUsername("");
    setPassword("");
    setCurrentPage("dashboard");
  }

  const shellClass = `liangos-app min-h-[100svh] min-h-[100dvh] overflow-x-hidden antialiased selection:bg-sky-500/20 ${
    resolvedTheme === "dark" ? "theme-dark" : "theme-light"
  }`;

  if (!isLogin) {
    return (
      <div className={shellClass}>
        <LoginPage
          username={username}
          password={password}
          message={message}
          onUsernameChange={setUsername}
          onPasswordChange={setPassword}
          onLogin={login}
        />
      </div>
    );
  }

  return (
    <div className={shellClass}>
      <DashboardShell
        username={username}
        currentPage={currentPage}
        theme={theme}
        resolvedTheme={resolvedTheme}
        onThemeToggle={toggleTheme}
        onPageChange={setCurrentPage}
        onLogout={logout}
      />
    </div>
  );
}

export default App;
