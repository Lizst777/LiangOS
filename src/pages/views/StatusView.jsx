import { useState } from "react";
import {
  SYSTEM_CORE_STATUS,
  SYSTEM_DETAIL_GROUPS,
} from "../../data/systemStatus";
import Card from "../../ui/Card";
import InfoRow from "../../ui/InfoRow";
import StatBlock from "../../ui/StatBlock";

function StatusView() {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <section className="bento">
      <section className="bento__span-4">
        <StatBlock value="OK" label="整体状态" badge="运行正常" />
      </section>
      <section className="bento__span-8">
        <Card
          title="运行环境"
          subtitle="核心模块与硬件信息"
          className="system-status-card"
          headerRight={
            <span className="system-status-card__badge">静态配置</span>
          }
        >
          <div className="system-status-card__section">
            <h3 className="system-status-card__section-title">核心信息</h3>
            <div className="system-status-card__rows">
              {SYSTEM_CORE_STATUS.map((item) => (
                <InfoRow
                  key={item.label}
                  label={item.label}
                  value={item.value}
                />
              ))}
            </div>
          </div>

          <div className="system-status-card__section">
            <h3 className="system-status-card__section-title">前端运行状态</h3>
            <div className="system-status-card__module-grid">
              <span>React</span>
              <strong>Running</strong>
              <span>Vite</span>
              <strong>Active</strong>
              <span>Component Mode</span>
              <strong>Enabled</strong>
            </div>
          </div>

          <button
            type="button"
            className="system-status-card__toggle"
            onClick={() => setIsExpanded((value) => !value)}
            aria-expanded={isExpanded}
          >
            {isExpanded ? "收起详情" : "查看更多配置"}
          </button>

          {isExpanded && (
            <div className="system-status-card__details">
              {SYSTEM_DETAIL_GROUPS.map((group) => (
                <section
                  key={group.title}
                  className="system-status-card__detail-group"
                >
                  <h3 className="system-status-card__section-title">
                    {group.title}
                  </h3>
                  <div className="system-status-card__rows">
                    {group.items.map((item) => (
                      <InfoRow
                        key={item.label}
                        label={item.label}
                        value={item.value}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </Card>
      </section>
    </section>
  );
}

export default StatusView;
