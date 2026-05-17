import Card from "../../ui/Card";
import InfoRow from "../../ui/InfoRow";
import QuickLink from "../../ui/QuickLink";
import StatBlock from "../../ui/StatBlock";

function DashboardView({ theme }) {
  const styleLabel =
    theme === "dark"
      ? "深色 · Apple / Linear / Notion"
      : "浅色 · 白色高级感";

  return (
    <section className="bento">
      <section className="bento__span-8">
        <Card title="系统概览" subtitle="账户与界面配置">
          <InfoRow label="当前用户" value="liang" />
          <InfoRow label="登录状态" value="Active" />
          <InfoRow label="界面风格" value={styleLabel} />
        </Card>
      </section>

      <section className="bento__span-4">
        <StatBlock value="4" label="工作区模块" badge="全部就绪" />
      </section>

      <section className="bento__span-4">
        <Card title="快捷入口" subtitle="常用工具">
          <QuickLink label="ChatGPT" />
          <QuickLink label="GitHub" />
          <QuickLink label="Bilibili" />
        </Card>
      </section>

      <section className="bento__span-8">
        <Card title="今日状态" subtitle="工作区动态">
          <p>
            个人数字空间已切换为组件化架构。侧栏支持折叠，页面切换带有轻量过渡动画。
          </p>
        </Card>
      </section>
    </section>
  );
}

export default DashboardView;
