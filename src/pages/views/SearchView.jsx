import { useMemo, useState } from "react";
import {
  POPULAR_SEARCH_TERMS,
  SEARCH_CATEGORIES,
  SEARCH_SORTS,
  TYPE_LABELS,
} from "../../data/searchMock";
import { getGoogleSearchUrl, searchItems } from "../../utils/search";

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
    /* localStorage can be unavailable in restricted contexts. */
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
    if (!hasSearched) return [];

    return searchItems({
      query,
      category,
      sortBy,
    });
  }, [category, hasSearched, query, sortBy]);

  function rememberSearch(nextQuery) {
    const keyword = nextQuery.trim();
    if (!keyword) return;

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

  function handleSubmit(event) {
    event.preventDefault();
    runInternalSearch();
  }

  function handleGoogleSearch() {
    const keyword = inputValue.trim();
    if (!keyword) return;

    rememberSearch(keyword);
    window.open(getGoogleSearchUrl(keyword), "_blank", "noopener,noreferrer");
  }

  return (
    <main className="search-surface page-scroll" aria-label="Search">
      <form className="search-surface__form" onSubmit={handleSubmit}>
        <p className="editorial-kicker">Search LiangOS</p>
        <input
          className="editorial-input search-surface__input"
          type="search"
          placeholder="Search"
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          aria-label="Search LiangOS"
        />
        <div className="editorial-actions">
          <button type="submit">Local</button>
          <button type="button" onClick={handleGoogleSearch}>
            Web
          </button>
          <button type="button" onClick={() => runInternalSearch("notes")}>
            Notes
          </button>
        </div>
      </form>

      {!hasSearched && (
        <div className="search-surface__quiet">
          <div className="editorial-inline-list" aria-label="Popular searches">
            {POPULAR_SEARCH_TERMS.slice(0, 4).map((term) => (
              <button key={term} type="button" onClick={() => runInternalSearch(term)}>
                {term}
              </button>
            ))}
          </div>
          {history.length > 0 && (
            <div className="editorial-inline-list" aria-label="Recent searches">
              {history.slice(0, 4).map((term) => (
                <button key={term} type="button" onClick={() => runInternalSearch(term)}>
                  {term}
                </button>
              ))}
            </div>
          )}
        </div>
      )}

      {hasSearched && (
        <section className="search-surface__results" aria-label="Search results">
          <div className="editorial-meta-row">
            <span>{query || "Empty"}</span>
            <span>{results.length} results</span>
          </div>

          <div className="editorial-controls" aria-label="Search filters">
            {SEARCH_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                className={category === cat.id ? "is-active" : undefined}
                onClick={() => setCategory(cat.id)}
              >
                {cat.label}
              </button>
            ))}
            <select
              value={sortBy}
              onChange={(event) => setSortBy(event.target.value)}
              aria-label="Sort results"
            >
              {SEARCH_SORTS.map((sort) => (
                <option key={sort.id} value={sort.id}>
                  {sort.label}
                </option>
              ))}
            </select>
          </div>

          {results.length > 0 ? (
            <ul className="editorial-list">
              {results.map((item) => (
                <li key={item.id} className="editorial-list__item">
                  <a href={item.link} target="_blank" rel="noopener noreferrer">
                    <span>{item.title}</span>
                    <small>
                      {TYPE_LABELS[item.type]} · {item.description}
                    </small>
                  </a>
                </li>
              ))}
            </ul>
          ) : (
            <p className="editorial-empty">No local results.</p>
          )}
        </section>
      )}
    </main>
  );
}

export default SearchView;
