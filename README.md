# Fold / 折页

把一张照片做成可编辑、可导出的折页动态海报。正式地址沿用 https://lizst.cafe。

只有一套页面和一套构建。旧 LiangOS 的时间、天气、名言、Notes 与登录页面已退出当前源码；不再维护独立原型入口。

## 使用

1. 选择本地照片，拖动预览调整裁切。
2. 编辑标题、副标题和署名，选择纸色与画幅。
3. 播放 10 秒折叠动画，或放大检查正反面。
4. 导出平展 PNG，或在支持的浏览器中生成 MP4 / WebM。

照片不上传服务器。IndexedDB 自动保存一份本机草稿，支持本次打开期间的撤销与重做。清除浏览器数据可能删除草稿；重要作品请导出。

## 开发与验证

```sh
npm ci
npm run dev
npm run lint
npm test
npm run format:check
npm run build
npm run preview
npm run verify:video -- /path/to/export.mp4
```

开发入口是 http://127.0.0.1:5173/，生产文件只输出到 `dist/`。Node.js 22.12+ 或 24 LTS。唯一运行时依赖是按需加载的视频编码库 `mediabunny`；没有 React、Tailwind、Supabase 或动画框架。

## 代码边界

| 位置                                                                | 职责                           |
| ------------------------------------------------------------------- | ------------------------------ |
| `index.html`                                                        | 唯一页面入口和语义结构         |
| `src/studio.js`                                                     | 表单与各模块接线               |
| `src/work-document.js`、`document-session.js`、`draft-store.js`     | 作品、撤销历史、本机草稿       |
| `src/geometry.js`、`renderer.js`、`texture-mesh.js`                 | 折叠几何与绘制                 |
| `src/poster-texture.js`、`text-layout.js`、`image-resource.js`      | 纸面排版和图片资源             |
| `src/preview-controller.js`、`detail-viewer.js`、`editor-panels.js` | 播放、细节查看、小屏面板       |
| `src/export.js`、`export-dialog.js`、`frame-sequence.js`            | 固定帧率编码与下载             |
| `src/*.css`                                                         | 颜色、基础界面和移动布局       |
| `test/`                                                             | Fold 自动化测试                |
| `scripts/verify-video.mjs`                                          | 对实际导出文件核验帧数和时间戳 |
| `docs/`                                                             | 功能边界与旧站恢复说明         |

不要把播放进度、面板状态或导出任务写入作品数据；不要复制另一套移动端编辑器；不要把构建产物当作手写源码修改。

## 发布

复用原 Netlify 项目 `liangos` 与域名，不创建第二个站点。构建命令 `npm run build`，发布目录 `dist`。普通 `netlify deploy --dir=dist` 是预览，正式发布才使用 `--prod`。Git 推送生产分支可能自动发布，推送前必须验证。

旧 `/prototypes/fold/` 地址在 Netlify 重定向到 `/`。原型与正式页面同源时，已有 Fold 草稿继续使用相同数据库；不同域名或端口的浏览器草稿不会自动转移。

## 已知边界

真实 iPhone 的相册格式、键盘、浏览器存储和视频编码仍需实机验收；HEIC 不在当前承诺支持的格式内。视频编码失败时保留 PNG，不上传照片到服务器代为处理。

参见 [功能与实现说明](docs/fold.md) 和 [旧站恢复记录](docs/migration.md)。
