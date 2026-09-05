export const NAV_ITEMS = [
  { id: "dashboard", label: "Home", icon: "home" },
  { id: "notes", label: "Notes", icon: "note" },
];

export function getNavigationPage(pageId) {
  return NAV_ITEMS.find((item) => item.id === pageId) ?? NAV_ITEMS[0];
}

export function getNavigationDestination(pageId) {
  return NAV_ITEMS.find((item) => item.id !== pageId) ?? NAV_ITEMS[0];
}
