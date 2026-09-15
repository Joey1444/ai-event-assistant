# 进度记录

> 更新规则：每完成一轮自治循环，在「变更日志」顶部追加一条，并同步更新「当前状态」。日期用绝对日期。

## 当前状态（截至 2026-09-15）

- **状态**：MVP 核心功能完成，本地可运行（`npm run dev` → http://localhost:3000）
- **已完成**：18 张表的 Prisma schema；10 个 Agent（PM / Strategist / Critic / FactChecker / Planner / Budget / Copywriter / Poster / Designer / QA）；2 道人工关卡；全部面板 UI；统一 AI provider 层（走 CCSwitch → DeepSeek）；`/ai-test` 连通性测试
- **未完成**：见 `TASKS.md`（Researcher、测试体系、海报导出、版本对比等）
- **已知坑**（详见 README「踩坑记录」）：deepseek-v4-pro 需 8000–16000 max_tokens；Claude 沙箱跑 next build 报 EXDEV；npm 11 拦截 Prisma postinstall

## 变更日志

<!-- 每轮追加一行：`- [日期] 内容（提交 hash）` -->
- [2026-09-15] 建立自治循环（CLAUDE.md / TASKS.md / PROJECT_SPEC.md / PROGRESS.md / verify.sh），`git init`，修基线 9 个 lint 错误（8×prefer-const + 1×`<a>`→`<Link>`）；typecheck + lint 已全绿（未提交）
