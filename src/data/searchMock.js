/**
 * Search Hub 本地 mock 索引。
 * 接真实 API 时：用接口返回替换 SEARCH_MOCK_ITEMS，或在页面层请求后传入 searchItems。
 */
export const SEARCH_CATEGORIES = [
  { id: "all", label: "全部" },
  { id: "website", label: "网站" },
  { id: "music", label: "音乐" },
  { id: "tool", label: "工具" },
  { id: "document", label: "文档" },
];

export const SEARCH_SORTS = [
  { id: "default", label: "默认" },
  { id: "relevance", label: "相关度" },
  { id: "recent", label: "最近更新" },
];

export const POPULAR_SEARCH_TERMS = [
  "React",
  "网易云",
  "AI 工具",
  "项目文档",
  "Linear",
  "CSS",
];

export const SEARCH_MOCK_ITEMS = [
  {
    id: "site-react",
    title: "React 官方文档",
    description:
      "React 组件、Hooks、状态管理与界面构建的官方参考入口。",
    link: "https://react.dev",
    type: "website",
    updatedAt: "2026-05-12",
    keywords: ["react", "hooks", "前端", "文档"],
  },
  {
    id: "site-vite",
    title: "Vite 构建工具",
    description: "LiangOS 当前项目使用的前端构建工具，适合快速开发 React 应用。",
    link: "https://vite.dev",
    type: "website",
    updatedAt: "2026-05-10",
    keywords: ["vite", "react", "构建", "dev"],
  },
  {
    id: "site-mdn",
    title: "MDN Web Docs",
    description: "HTML、CSS、JavaScript 与浏览器 API 的权威 Web 技术资料。",
    link: "https://developer.mozilla.org",
    type: "website",
    updatedAt: "2026-04-30",
    keywords: ["mdn", "css", "javascript", "web"],
  },
  {
    id: "music-space",
    title: "网易云音乐空间",
    description:
      "LiangOS 内的网易云歌单入口，保留歌单 ID 7914860873，并支持打开网易云收听。",
    link: "https://music.163.com/#/playlist?id=7914860873",
    type: "music",
    updatedAt: "2026-05-17",
    keywords: ["网易云", "音乐", "歌单", "7914860873"],
  },
  {
    id: "music-jj",
    title: "美人鱼 · 林俊杰",
    description: "来自当前网易云歌单的音乐条目索引，用于 LiangOS 内部资源搜索。",
    link: "https://music.163.com/#/song?id=108242",
    type: "music",
    updatedAt: "2026-05-17",
    keywords: ["林俊杰", "美人鱼", "音乐"],
  },
  {
    id: "music-playlist-note",
    title: "歌单数据接入说明",
    description:
      "记录音乐空间的真实歌单数据接入方式：优先使用本地代理，不使用模拟歌曲伪装真实数据。",
    link: "https://music.163.com/#/playlist?id=7914860873",
    type: "music",
    updatedAt: "2026-05-16",
    keywords: ["歌单", "网易云", "数据接入"],
  },
  {
    id: "tool-chatgpt",
    title: "ChatGPT",
    description: "对话式 AI 助手，可用于代码解释、方案讨论与文档草稿生成。",
    link: "https://chat.openai.com",
    type: "tool",
    updatedAt: "2026-05-08",
    keywords: ["ai", "chatgpt", "工具", "写作"],
  },
  {
    id: "tool-figma",
    title: "Figma",
    description: "界面设计与原型工具，支持组件库、自动布局与设计协作。",
    link: "https://www.figma.com",
    type: "tool",
    updatedAt: "2026-04-24",
    keywords: ["figma", "设计", "ui", "工具"],
  },
  {
    id: "tool-vscode",
    title: "VS Code",
    description: "可扩展代码编辑器，内置终端、Git 与丰富插件生态。",
    link: "https://code.visualstudio.com",
    type: "tool",
    updatedAt: "2026-04-18",
    keywords: ["vscode", "编辑器", "工具"],
  },
  {
    id: "tool-postman",
    title: "Postman",
    description: "API 调试与协作工具，支持环境变量、集合与自动化测试。",
    link: "https://www.postman.com",
    type: "tool",
    updatedAt: "2026-03-29",
    keywords: ["postman", "api", "调试", "工具"],
  },
  {
    id: "doc-readme",
    title: "LiangOS 项目 README",
    description: "项目启动、构建、预览与模块说明文档。",
    link: "README.md",
    type: "document",
    updatedAt: "2026-05-13",
    keywords: ["liangos", "readme", "项目", "文档"],
  },
  {
    id: "doc-hig",
    title: "Apple Human Interface Guidelines",
    description: "Apple 设计指南：排版、间距、深色模式与无障碍设计原则。",
    link: "https://developer.apple.com/design",
    type: "document",
    updatedAt: "2026-04-12",
    keywords: ["apple", "design", "ui", "文档"],
  },
  {
    id: "doc-typescript",
    title: "TypeScript Handbook",
    description: "TypeScript 官方手册：类型系统、泛型、模块与工程化配置说明。",
    link: "https://www.typescriptlang.org/docs",
    type: "document",
    updatedAt: "2026-03-20",
    keywords: ["typescript", "文档", "类型"],
  },
  {
    id: "doc-easyx",
    title: "EasyX 文档",
    description: "C/C++ 图形库 EasyX 的函数说明与示例资料。",
    link: "https://docs.easyx.cn",
    type: "document",
    updatedAt: "2026-02-14",
    keywords: ["easyx", "c++", "图形库", "文档"],
  },
];

export const TYPE_LABELS = {
  website: "网站",
  music: "音乐",
  tool: "工具",
  document: "文档",
};
