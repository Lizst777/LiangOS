import { useEffect, useState } from "react";
import DashboardShell from "./pages/DashboardShell";
import LoginPage from "./pages/LoginPage";

const THEME_STORAGE_KEY = "liangos-theme";

function readStoredTheme() {
  try {
    return localStorage.getItem(THEME_STORAGE_KEY) === "dark" ? "dark" : "light";
  } catch {
    return "light";
  }
}

function App() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLogin, setIsLogin] = useState(false);
  const [currentPage, setCurrentPage] = useState("dashboard");
  const [message, setMessage] = useState("");
  const [theme, setTheme] = useState(readStoredTheme);

  useEffect(() => {
    try {
      localStorage.setItem(THEME_STORAGE_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((t) => (t === "light" ? "dark" : "light"));
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

  const shellClass = `liangos-app min-h-screen antialiased selection:bg-sky-500/20 ${
    theme === "dark" ? "theme-dark" : "theme-light"
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
        onThemeToggle={toggleTheme}
        onPageChange={setCurrentPage}
        onLogout={logout}
      />
    </div>
  );
}

export default App;
