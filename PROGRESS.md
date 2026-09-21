# 进度记录

> 更新规则：每完成一轮自治循环，在「变更日志」顶部追加一条，并同步更新「当前状态」。日期用绝对日期。

## 当前状态（截至 2026-09-20）

- **状态**：MVP 核心功能完成，本地可运行（`npm run dev` → http://localhost:3000）
- **已完成**：16 张表的 Prisma schema；11 个 Agent（PM / Researcher / Strategist / Critic / FactChecker / Planner / Budget / Copywriter / Poster / PosterDesigner / QA）；2 道人工关卡；全部面板 UI；文本经 CCSwitch 网关（DeepSeek）、文生图直连第三方 OpenAI 兼容服务；Researcher 联网调研（Tavily）；`/ai-test` 连通性测试
- **未完成**：见 `TASKS.md`（测试体系、海报导出、版本对比等）
- **已知坑**（详见 README「踩坑记录」）：deepseek-v4-pro 需 8000–16000 max_tokens；Claude 沙箱跑 next build 报 EXDEV；npm 11 拦截 Prisma postinstall

## 变更日志

<!-- 每轮追加一行：`- [日期] 内容（提交 hash）` -->
- [2026-09-21] 接入文生图 + 新增 PosterDesigner Agent + 删除 Designer：`generateImage()` 直连第三方 OpenAI 兼容 `/v1/images/generations`（key 走 `IMAGE_API_*` 服务端 env，含 MIME 魔数校验）；新增 `posterDesigner` agent（海报文案→文生图提示词，首图/图生图双模式）；新增 `PosterImage` 表（历史版本对比 + 基于上一张图修改）；删除 designer（HTML 海报）及其全部引用；表数 16→16（PosterDesign→PosterImage）
- [2026-09-20] 同步文档：Researcher Agent 已实现（`researcher.ts` + `ResearcherPanel` + registry/actions 接入，Tavily 联网检索）；README/TASKS 补齐 Researcher 与 `TAVILY_API_KEY`；prisma 表数 18→16
- [2026-09-15] 建立自治循环（CLAUDE.md / TASKS.md / PROJECT_SPEC.md / PROGRESS.md / verify.sh），`git init`，修基线 9 个 lint 错误（8×prefer-const + 1×`<a>`→`<Link>`）；typecheck + lint 已全绿（未提交）
