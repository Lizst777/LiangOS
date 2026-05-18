import { useMemo } from "react";
import Card from "../../ui/Card";
import InfoRow from "../../ui/InfoRow";
import TimeCard from "../../ui/TimeCard";
import WeatherCard from "../../ui/WeatherCard";
import { TOOLS } from "../../data/tools";
import { loadRecentToolIds } from "../../utils/toolsRecent";

function DashboardView() {
  const recentToolIds = loadRecentToolIds();
  const recentTools = useMemo(
    () =>
      recentToolIds
        .map((id) => TOOLS.find((tool) => tool.id === id))
        .filter(Boolean),
    [recentToolIds],
  );

  return (
    <section className="bento">
      <section className="bento__span-8">
        <TimeCard />

        <Card title="今日概览" subtitle="快捷入口与系统摘要">
          <div className="dashboard-summary">
            <InfoRow label="本地工具总数" value={`${TOOLS.length} 个`} />
            <InfoRow
              label="最近访问"
              value={
                recentTools.length > 0
                  ? `${recentTools.length} 项`
                  : "暂无记录"
              }
            />
            <InfoRow label="运行状态" value="正常运行" />
          </div>

          <div className="dashboard-recent">
            <h3 className="dashboard-recent__title">最近访问工具</h3>
            {recentTools.length > 0 ? (
              <ul className="dashboard-recent__list">
                {recentTools.map((tool) => (
                  <li key={tool.id} className="dashboard-recent__item">
                    {tool.name}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="dashboard-recent__empty">
                访问“工具发现”后会显示最近记录。
              </p>
            )}
          </div>
        </Card>
      </section>

      <section className="bento__span-4">
        <WeatherCard />

        <Card title="系统状态" subtitle="轻量提示">
          <InfoRow label="当前用户" value="LiangOS" />
          <InfoRow label="主题模式" value="可切换" />
          <InfoRow label="侧边导航" value="实时可用" />
        </Card>
      </section>
    </section>
  );
}

export default DashboardView;
