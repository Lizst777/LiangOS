import { SEARCH_MOCK_ITEMS } from "../data/searchMock";

function normalizeText(value) {
  return String(value || "").trim().toLowerCase();
}

function getSearchText(item) {
  return [
    item.title,
    item.description,
    item.type,
    item.link,
    ...(item.keywords || []),
  ]
    .map(normalizeText)
    .join(" ");
}

function getRelevanceScore(item, keyword) {
  if (!keyword) {
    return 0;
  }

  const title = normalizeText(item.title);
  const description = normalizeText(item.description);
  const link = normalizeText(item.link);
  const keywords = (item.keywords || []).map(normalizeText);

  let score = 0;
  if (title === keyword) score += 80;
  if (title.includes(keyword)) score += 40;
  if (keywords.some((tag) => tag === keyword)) score += 30;
  if (keywords.some((tag) => tag.includes(keyword))) score += 18;
  if (description.includes(keyword)) score += 12;
  if (link.includes(keyword)) score += 6;

  return score;
}

function sortResults(results, sortBy, keyword) {
  const nextResults = [...results];

  if (sortBy === "relevance") {
    return nextResults.sort(
      (a, b) => getRelevanceScore(b, keyword) - getRelevanceScore(a, keyword),
    );
  }

  if (sortBy === "recent") {
    return nextResults.sort(
      (a, b) => new Date(b.updatedAt) - new Date(a.updatedAt),
    );
  }

  return nextResults;
}

/**
 * 在 LiangOS 本地 mock 索引中搜索。
 * 搜索范围：网站、音乐、工具、文档；不代表全网搜索。
 */
export function searchItems({
  query,
  category = "all",
  sortBy = "default",
  source = SEARCH_MOCK_ITEMS,
}) {
  const keyword = normalizeText(query);
  let results = source;

  if (category !== "all") {
    results = results.filter((item) => item.type === category);
  }

  if (keyword) {
    results = results.filter((item) => getSearchText(item).includes(keyword));
  }

  return sortResults(results, sortBy, keyword);
}

export function getGoogleSearchUrl(query) {
  return `https://www.google.com/search?q=${encodeURIComponent(query.trim())}`;
}

/**
 * 接真实 API 时的替换点示例：
 *
 * export async function searchItems({ query, category, sortBy }) {
 *   const res = await fetch(`/api/search?q=${encodeURIComponent(query)}&type=${category}&sort=${sortBy}`);
 *   const data = await res.json();
 *   return data.items; // 需包含 title, description, link, type, updatedAt
 * }
 */
