import Button from "../ui/Button";
import Input from "../ui/Input";

function LoginPage({
  username,
  password,
  message,
  onUsernameChange,
  onPasswordChange,
  onLogin,
}) {
  return (
    <div className="login-page">
      <div className="login-shell">
        <section className="login-info">
          <span className="ui-tag">Personal Digital System</span>
          <h1>LiangOS</h1>
          <p>
            个人数字空间。控制台、备忘录与项目空间，统一在一套极简界面中管理。
          </p>
        </section>

        <section className="login-card">
          <span className="ui-tag">Login</span>
          <h2>欢迎回来</h2>
          <p className="login-subtitle">登录你的 LiangOS 系统</p>

          <Input
            placeholder="账号"
            value={username}
            onChange={(e) => onUsernameChange(e.target.value)}
          />
          <Input
            type="password"
            placeholder="密码"
            value={password}
            onChange={(e) => onPasswordChange(e.target.value)}
          />

          <p className="ui-message">{message}</p>

          <Button onClick={onLogin}>登录</Button>

          <p className="ui-hint">默认账号：liang / 123456</p>
        </section>
      </div>
    </div>
  );
}

export default LoginPage;
