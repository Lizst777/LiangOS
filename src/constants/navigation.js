export const NAV_ITEMS = [
  { id: "dashboard", label: "总览", icon: "grid" },
  { id: "search", label: "搜索中心", icon: "search" },
  { id: "tools", label: "工具发现", icon: "compass" },
  { id: "music", label: "音乐空间", icon: "music" },
  { id: "notes", label: "私人备忘录", icon: "note" },
  { id: "projects", label: "项目空间", icon: "folder" },
  { id: "status", label: "系统状态", icon: "activity" },
];

export const PAGE_META = {
  dashboard: {
    title: "总览",
    description: "系统概览与快捷入口",
  },
  search: {
    title: "搜索中心",
    description: "搜索 LiangOS 内部资源，或使用 Google 搜索全网",
  },
  tools: {
    title: "工具发现",
    description: "探索 AI 与效率工具，收藏你常用的产品",
  },
  music: {
    title: "音乐空间",
    description: "网易云音乐歌单 · 跳转客户端或网页收听",
  },
  notes: {
    title: "私人备忘录",
    description: "加密存储的个人笔记",
  },
  projects: {
    title: "项目空间",
    description: "进行中的项目与作品",
  },
  status: {
    title: "系统状态",
    description: "运行环境与模块状态",
  },
};

export function getPageMeta(pageId) {
  return PAGE_META[pageId] ?? PAGE_META.dashboard;
}
