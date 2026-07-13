export const NAV_ITEMS = [
  { id: "dashboard", label: "Overview", icon: "grid" },
  { id: "notes", label: "Notes", icon: "note" },
];

export const PAGE_META = {
  dashboard: {
    title: "Overview",
    description: "",
  },
  search: {
    title: "Search",
    description: "",
  },
  music: {
    title: "Music",
    description: "",
  },
  notes: {
    title: "Notes",
    description: "",
  },
};

export function getPageMeta(pageId) {
  return PAGE_META[pageId] ?? PAGE_META.dashboard;
}
