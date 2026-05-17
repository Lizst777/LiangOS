import { useMemo, useState } from "react";
import {
  POPULAR_SEARCH_TERMS,
  SEARCH_CATEGORIES,
  SEARCH_SORTS,
  TYPE_LABELS,
} from "../../data/searchMock";
import { getGoogleSearchUrl, searchItems } from "../../utils/search";
import { IconSearch } from "../../ui/Icons";

const SEARCH_HISTORY_KEY = "liangos-search-history";
const MAX_HISTORY_ITEMS = 8;

function readSearchHistory() {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    const value = JSON.parse(raw || "[]");
    return Array.isArray(value) ? value.filter(Boolean).slice(0, MAX_HISTORY_ITEMS) : [];
  } catch {
    return [];
  }
}

function saveSearchHistory(history) {
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(history));
  } catch {
    /* localStorage 不可用时忽略历史记录写入。 */
  }
}

function SearchView() {
  const [inputValue, setInputValue] = useState("");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [sortBy, setSortBy] = useState("default");
  const [hasSearched, setHasSearched] = useState(false);
  const [history, setHistory] = useState(readSearchHistory);

  const results = useMemo(() => {
    if (!hasSearched) {
      return [];
    }

    return searchItems({
      query,
      category,
      sortBy,
    });
  }, [category, hasSearched, query, sortBy]);

  function rememberSearch(nextQuery) {
    const keyword = nextQuery.trim();
    if (!keyword) {
      return;
    }

    const nextHistory = [
      keyword,
      ...history.filter((item) => item.toLowerCase() !== keyword.toLowerCase()),
    ].slice(0, MAX_HISTORY_ITEMS);

    setHistory(nextHistory);
    saveSearchHistory(nextHistory);
  }

  function runInternalSearch(nextQuery = inputValue) {
    const keyword = nextQuery.trim();
    setInputValue(nextQuery);
    setQuery(keyword);
    setHasSearched(true);
    rememberSearch(keyword);
  }

  function handleSubmit(e) {
    e.preventDefault();
    runInternalSearch();
  }

  function handleGoogleSearch() {
    const keyword = inputValue.trim();
    if (!keyword) {
      return;
    }

    rememberSearch(keyword);
    window.open(getGoogleSearchUrl(keyword), "_blank", "noopener,noreferrer");
  }

  function clearHistory() {
    setHistory([]);
    saveSearchHistory([]);
  }

  const activeCategoryLabel =
    SEARCH_CATEGORIES.find((item) => item.id === category)?.label || "全部";

  return (
    <div className={hasSearched ? "search-hub search-hub--results" : "search-hub"}>
      <section className="search-hub__hero" aria-labelledby="search-hub-title">
        <div className="search-hub__intro">
          <span className="search-hub__eyebrow">Search Hub</span>
          <h2 id="search-hub-title" className="search-hub__hero-title">
            搜索 LiangOS 内部资源
          </h2>
          <p className="search-hub__hero-desc">或使用 Google 搜索全网</p>
        </div>

        <form className="search-hub__form" onSubmit={handleSubmit}>
          <div className="search-hub__input-wrap">
            <span className="search-hub__input-icon">
              <IconSearch />
            </span>
            <input
              className="search-hub__input"
              type="search"
              placeholder="搜索网站、音乐、工具、文档"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              aria-label="搜索 LiangOS 内部资源"
            />
          </div>
          <div className="search-hub__actions">
            <button type="submit" className="ui-btn search-hub__submit">
              LiangOS 内部搜索
            </button>
            <button
              type="button"
              className="ui-btn ui-btn--ghost search-hub__submit"
              onClick={handleGoogleSearch}
            >
              用 Google 搜索
            </button>
          </div>
        </form>

        {!hasSearched && (
          <div className="search-hub__home-grid">
            <section className="search-suggestions" aria-labelledby="popular-search-title">
              <div className="search-suggestions__header">
                <h3 id="popular-search-title">热门搜索词</h3>
              </div>
              <div className="search-chip-list">
                {POPULAR_SEARCH_TERMS.map((term) => (
                  <button
                    key={term}
                    type="button"
                    className="search-chip"
                    onClick={() => runInternalSearch(term)}
                  >
                    {term}
                  </button>
                ))}
              </div>
            </section>

            <section className="search-suggestions" aria-labelledby="recent-search-title">
              <div className="search-suggestions__header">
                <h3 id="recent-search-title">最近搜索记录</h3>
                {history.length > 0 && (
                  <button
                    type="button"
                    className="search-suggestions__clear"
                    onClick={clearHistory}
                  >
                    清空历史
                  </button>
                )}
              </div>
              {history.length > 0 ? (
                <div className="search-chip-list">
                  {history.map((term) => (
                    <button
                      key={term}
                      type="button"
                      className="search-chip"
                      onClick={() => runInternalSearch(term)}
                    >
                      {term}
                    </button>
                  ))}
                </div>
              ) : (
                <p className="search-suggestions__empty">暂无最近搜索记录</p>
              )}
            </section>
          </div>
        )}
      </section>

      {hasSearched && (
        <section className="search-results-panel" aria-labelledby="search-results-title">
          <div className="search-results-panel__summary">
            <div>
              <span className="search-results-panel__eyebrow">
                LiangOS 内部资源搜索
              </span>
              <h3 id="search-results-title">
                当前关键词：{query || "（空）"}
              </h3>
            </div>
            <span className="search-results-panel__count">
              {results.length} 条结果
            </span>
          </div>

          <div className="search-toolbar">
            <div className="search-toolbar__group" aria-label="分类筛选">
              {SEARCH_CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  className={
                    category === cat.id
                      ? "search-toolbar__pill search-toolbar__pill--active"
                      : "search-toolbar__pill"
                  }
                  onClick={() => setCategory(cat.id)}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <label className="search-sort">
              <span>排序</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                aria-label="搜索结果排序"
              >
                {SEARCH_SORTS.map((sort) => (
                  <option key={sort.id} value={sort.id}>
                    {sort.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          <p className="search-results-panel__note">
            当前仅搜索 LiangOS 本地 mock 数据，范围为{activeCategoryLabel}
            {category === "all" ? "分类" : ""}；全网内容请使用 Google 搜索。
          </p>

          {results.length > 0 ? (
            <ul className="search-results-list">
              {results.map((item) => (
                <li key={item.id} className="search-result">
                  <div className="search-result__body">
                    <div className="search-result__head">
                      <span className="search-result__type">
                        {TYPE_LABELS[item.type]}
                      </span>
                      <span className="search-result__updated">
                        更新于 {item.updatedAt}
                      </span>
                    </div>
                    <h4 className="search-result__title">{item.title}</h4>
                    <p className="search-result__desc">{item.description}</p>
                    <p className="search-result__url">{item.link}</p>
                  </div>
                  <a
                    className="ui-btn search-result__open"
                    href={item.link}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    打开
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <section className="search-empty">
              <p className="search-empty__title">没有找到匹配的内部资源</p>
              <p className="search-empty__desc">
                试试更短的关键词，切换到“全部”，或用 Google 搜索全网。
              </p>
              <button
                type="button"
                className="ui-btn ui-btn--ghost search-empty__google"
                onClick={handleGoogleSearch}
              >
                用 Google 搜索
              </button>
            </section>
          )}
        </section>
      )}
    </div>
  );
}

export default SearchView;
