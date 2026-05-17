import { TOOLS } from "../data/tools";

export const SORT_OPTIONS = [
  { id: "rating-desc", label: "推荐优先" },
  { id: "name-asc", label: "名称 A-Z" },
];

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function matchesQuery(tool, keyword) {
  if (!keyword) {
    return true;
  }

  return [
    tool.name,
    tool.desc,
    tool.category,
    ...(tool.tags || []),
  ]
    .map(normalize)
    .some((value) => value.includes(keyword));
}

export function filterTools(
  {
    query = "",
    category = "all",
    sort = "rating-desc",
    favoriteOnly = false,
    favoriteIds = [],
  },
  source = TOOLS,
) {
  const keyword = normalize(query);
  let list = [...source];

  if (favoriteOnly) {
    list = list.filter((tool) => favoriteIds.includes(tool.id));
  }

  if (category !== "all") {
    list = list.filter((tool) => tool.category === category);
  }

  list = list.filter((tool) => matchesQuery(tool, keyword));

  if (sort === "name-asc") {
    list.sort((a, b) => a.name.localeCompare(b.name));
  } else {
    list.sort((a, b) => b.rating - a.rating);
  }

  return list;
}

export function getFeaturedTools(source = TOOLS, limit = 4) {
  return [...source]
    .filter((tool) => tool.featured)
    .sort((a, b) => b.rating - a.rating)
    .slice(0, limit);
}
