import { AnimatePresence, motion } from "framer-motion";
import { useMemo, useState } from "react";
import {
  motionHoverTransition,
  motionTapTransition,
  motionTransition,
} from "../../utils/motion";
import { TOOL_CATEGORIES, TOOLS } from "../../data/tools";
import ToolCard from "../../ui/ToolCard";
import { IconSearch } from "../../ui/Icons";
import {
  filterTools,
  getFeaturedTools,
  SORT_OPTIONS,
} from "../../utils/toolsFilter";
import {
  loadFavoriteIds,
  toggleFavoriteId,
} from "../../utils/toolsFavorites";
import {
  loadRecentToolIds,
  recordRecentTool,
} from "../../utils/toolsRecent";

function ToolsView() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState("rating-desc");
  const [favoriteOnly, setFavoriteOnly] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState(loadFavoriteIds);
  const [recentToolIds, setRecentToolIds] = useState(loadRecentToolIds);

  const featuredTools = useMemo(() => getFeaturedTools(TOOLS), []);
  const recentTools = useMemo(
    () =>
      recentToolIds
        .map((id) => TOOLS.find((tool) => tool.id === id))
        .filter(Boolean),
    [recentToolIds],
  );
  const tools = useMemo(
    () =>
      filterTools({
        query,
        category,
        sort,
        favoriteOnly,
        favoriteIds,
      }),
    [category, favoriteIds, favoriteOnly, query, sort],
  );

  function handleToggleFavorite(id) {
    setFavoriteIds((prev) => toggleFavoriteId(id, prev));
  }

  function handleVisit(id) {
    setRecentToolIds((prev) => recordRecentTool(id, prev));
  }

  const shouldShowFeatured =
    query.trim() === "" && category === "all" && !favoriteOnly;

  return (
    <div className="tools-discovery">
      <section className="tools-discovery__hero">
        <div>
          <span className="tools-discovery__eyebrow">Tool Center</span>
          <h2 className="tools-discovery__hero-title">LiangOS 工具中心</h2>
          <p className="tools-discovery__hero-desc">
            把常用 AI、开发、设计、学习与系统工具收进一个系统级入口。
          </p>
        </div>
        <div className="tools-discovery__hero-metrics">
          <span>{TOOLS.length}</span>
          <strong>本地工具</strong>
        </div>
      </section>

      <section className="tools-recent">
        <div className="tools-discovery__section-head">
          <div>
            <h2 className="tools-discovery__section-title">最近访问</h2>
            <p className="tools-discovery__section-desc">
              点击工具访问后自动记录，最多显示 3 个。
            </p>
          </div>
        </div>
        {recentTools.length > 0 ? (
          <div className="tools-recent__grid">
            {recentTools.map((tool, index) => (
              <motion.a
                key={tool.id}
                className="tools-recent__item"
                href={tool.url}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => handleVisit(tool.id)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.01, y: -1 }}
                transition={{
                  ...motionTransition,
                  delay: index * 0.04,
                }}
              >
                <span className="tools-recent__icon">{tool.icon}</span>
                <span>
                  <strong>{tool.name}</strong>
                  <small>{tool.desc}</small>
                </span>
              </motion.a>
            ))}
          </div>
        ) : (
          <div className="tools-recent__empty">
            还没有最近访问记录，打开任意工具后会显示在这里。
          </div>
        )}
      </section>

      <section className="tools-discovery__toolbar">
        <div className="tools-discovery__search-row">
          <div className="tools-discovery__search-wrap">
            <span className="tools-discovery__search-icon">
              <IconSearch />
            </span>
            <input
              className="tools-discovery__search"
              type="search"
              placeholder="搜索工具名称、简介或标签"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              aria-label="搜索工具"
            />
          </div>
          <select
            className="tools-discovery__sort"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="工具排序"
          >
            {SORT_OPTIONS.map((opt) => (
              <option key={opt.id} value={opt.id}>
                {opt.label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className={
              favoriteOnly
                ? "tools-discovery__favorite-toggle tools-discovery__favorite-toggle--active"
                : "tools-discovery__favorite-toggle"
            }
            onClick={() => setFavoriteOnly((value) => !value)}
            aria-pressed={favoriteOnly}
          >
            只看收藏
            <span>{favoriteIds.length}</span>
          </button>
        </div>

        <motion.div
          layout
          className="tools-discovery__filters"
          role="tablist"
          aria-label="工具分类"
          transition={motionTransition}
        >
          {TOOL_CATEGORIES.map((cat) => (
            <motion.button
              layout
              key={cat.id}
              type="button"
              role="tab"
              aria-selected={category === cat.id}
              className={
                category === cat.id
                  ? "tools-discovery__filter tools-discovery__filter--active"
                  : "tools-discovery__filter"
              }
              onClick={() => setCategory(cat.id)}
              whileHover={{ scale: 1.01 }}
              whileTap={{ scale: 0.98 }}
              transition={motionHoverTransition}
            >
              {cat.label}
            </motion.button>
          ))}
        </motion.div>
      </section>

      {shouldShowFeatured && (
        <section>
          <div className="tools-discovery__section-head">
            <div>
              <h2 className="tools-discovery__section-title">精选工具</h2>
              <p className="tools-discovery__section-desc">
                系统默认推荐，适合高频启动。
              </p>
            </div>
          </div>
          <div className="tools-discovery__popular">
            <AnimatePresence>
              {featuredTools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onVisit={handleVisit}
                  compact
                  index={index}
                />
              ))}
            </AnimatePresence>
          </div>
        </section>
      )}

      <section>
        <div className="tools-discovery__section-head">
          <div>
            <h2 className="tools-discovery__section-title">工具库</h2>
            <p className="tools-discovery__count">
              当前显示 <strong>{tools.length}</strong> 款工具
              {favoriteOnly && (
                <>
                  {" "}
                  · 收藏模式 <strong>{favoriteIds.length}</strong> 款
                </>
              )}
            </p>
          </div>
        </div>

        <motion.div layout className="tools-discovery__grid" transition={motionTransition}>
          <AnimatePresence mode="popLayout">
            {tools.length > 0 ? (
              tools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  favoriteIds={favoriteIds}
                  onToggleFavorite={handleToggleFavorite}
                  onVisit={handleVisit}
                  index={index}
                />
              ))
            ) : (
              <motion.div
                key="empty"
                className="tools-discovery__empty"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 8 }}
                transition={motionTransition}
              >
                <p className="tools-discovery__empty-title">没有匹配的工具</p>
                <p>
                  试试减少关键词、切换分类，或关闭“只看收藏”。
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </section>
    </div>
  );
}

export default ToolsView;
