import { useMemo, useState } from "react";
import { CATEGORY_LABELS, TOOL_CATEGORIES, TOOLS } from "../../data/tools";
import {
  filterTools,
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

  const recentTools = useMemo(
    () =>
      recentToolIds
        .map((id) => TOOLS.find((tool) => tool.id === id))
        .filter(Boolean)
        .slice(0, 3),
    [recentToolIds],
  );

  function handleToggleFavorite(id) {
    setFavoriteIds((prev) => toggleFavoriteId(id, prev));
  }

  function handleVisit(id) {
    setRecentToolIds((prev) => recordRecentTool(id, prev));
  }

  return (
    <main className="tools-surface page-scroll" aria-label="Tools">
      <section className="tools-surface__command">
        <p className="editorial-kicker">Tools</p>
        <input
          className="editorial-input tools-surface__input"
          type="search"
          placeholder="Launch utility"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          aria-label="Search tools"
        />
        <div className="editorial-actions">
          <button type="button" onClick={() => setFavoriteOnly((value) => !value)}>
            Favorites {favoriteIds.length > 0 ? favoriteIds.length : ""}
          </button>
          <select
            value={sort}
            onChange={(event) => setSort(event.target.value)}
            aria-label="Sort tools"
          >
            {SORT_OPTIONS.map((option) => (
              <option key={option.id} value={option.id}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </section>

      <div className="editorial-controls" aria-label="Tool categories">
        {TOOL_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            className={category === cat.id ? "is-active" : undefined}
            onClick={() => setCategory(cat.id)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {recentTools.length > 0 && (
        <div className="editorial-inline-list" aria-label="Recent tools">
          {recentTools.map((tool) => (
            <a
              key={tool.id}
              href={tool.url}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => handleVisit(tool.id)}
            >
              {tool.name}
            </a>
          ))}
        </div>
      )}

      {tools.length > 0 ? (
        <ul className="editorial-list tools-surface__list">
          {tools.map((tool) => {
            const isFavorite = favoriteIds.includes(tool.id);

            return (
              <li key={tool.id} className="editorial-list__item">
                <a
                  href={tool.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleVisit(tool.id)}
                >
                  <span>{tool.name}</span>
                  <small>
                    {CATEGORY_LABELS[tool.category]} · {tool.desc}
                  </small>
                </a>
                <button
                  type="button"
                  className={isFavorite ? "is-active" : undefined}
                  onClick={() => handleToggleFavorite(tool.id)}
                  aria-label={isFavorite ? `Remove ${tool.name}` : `Favorite ${tool.name}`}
                >
                  {isFavorite ? "Saved" : "Save"}
                </button>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="editorial-empty">No tools.</p>
      )}
    </main>
  );
}

export default ToolsView;
