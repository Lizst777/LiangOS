# LiangOS 替换记录

## 恢复点

- 原来已提交的基线：`47cbaaa`。
- 包含替换前全部项目改动与 Fold 原型的检查点：`cb63e01946b6dfc78aebf932e34dd2b8d9519655`。
- 本机额外备份：`C:\Users\Lizst\Documents\LiangOS-backups\20260909-before-fold`。

备份保留旧 `src`、`public`、`scripts`、`docs`、Supabase 迁移和本地环境配置。环境文件不应重新上传或复制进公开文档。

需要查看旧版本时，优先创建单独 Git worktree 检查上述提交，不要对正在使用的工作区执行强制重置。被排除的 `tools/` 与 `tmp_ai_pdf_preview/` 未移动、未提交。

## 本次边界

Fold 取代网站的前端与构建，保留原 Git 仓库、Netlify 站点和域名。移除旧前端依赖、样式、图片、名言同步脚本与环境配置；没有删除远端数据库、用户、历史记录或改变数据库权限。

Fold 的 IndexedDB 名称和文档格式不变。旧 Notes 等浏览器数据不会被代码主动删除。预览地址与正式域名不同源时，草稿分别保存，不能假定自动迁移。
