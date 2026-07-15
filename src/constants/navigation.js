export const NAV_ITEMS = [
  { id: "dashboard", label: "Home", icon: "home" },
  { id: "notes", label: "Notes", icon: "note" },
];

export const PAGE_META = {
  dashboard: {
    title: "Home",
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
