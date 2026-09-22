# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md
@rules/AI_DEVELOPMENT_RULES.md
@rules/CONTRIBUTING.md
@rules/PROJECT_SPEC.md
@TASKS.md
@PROGRESS.md

## 常用命令

| 命令 | 用途 |
|---|---|
| `npm run dev` | 启动开发服务器（http://localhost:3000） |
| `npm run build` | 生产构建 |
| `npm run lint` | ESLint |
| `npx tsc --noEmit` | TypeScript 类型检查 |
| `npx prisma generate` | 生成 Prisma 客户端（重装依赖后必跑：npm 11 会拦截 postinstall） |
| `npx prisma db push` | 把 `prisma/schema.prisma` 同步到 SQLite `dev.db` |
| `./verify.sh` | 迭代验证闸门 = typecheck + lint + build 三连，全绿才算完成 |

暂无单元测试（`package.json` 无 `test` script）；补测试是 `TASKS.md` Phase 0 的一项，补完需接入 `verify.sh`。

环境变量见 `.env.example`（每个变量都有注释）。项目不直接持有模型 Provider 的 Key，真实 Key 不要写进前端或提交。

## 架构大图

Next.js 16（App Router）+ TypeScript + Tailwind CSS 4；Prisma 6 + SQLite（数据模型见 `prisma/schema.prisma`）。

一次活动策划是一条流水线，多个 AI Agent 依次推进（顺序以 `registry.ts` 为准），中间 2 道必须真人点击的关卡：

```
简报 → PM → Strategist → Critic → FactChecker → 🧑Gate1 选方向
     → Planner → Budget → Copywriter → Poster → (PosterDesigner 可选) → QA → 🧑Gate2 审批
```

- **AI 唯一入口**：文本模型统一走 `lib/ai/provider.ts` 的 `generateText()`，直连 DeepSeek 官方 API（`AI_BASE_URL` / `AI_API_KEY` / `AI_MODEL`）；文生图走 `generateImage()`，直连第三方 DashScope 原生 API（`IMAGE_API_BASE_URL` / `IMAGE_API_KEY` / `IMAGE_MODEL`）。业务代码 / Agent 禁止直接 fetch 模型端点或写死 Provider。
- **联网调研**：Researcher Agent 走 `lib/ai/tavily.ts`（`TAVILY_API_KEY`）做实时检索，产出入库 ResearchItem / Fact，无来源标 UNKNOWN。
- **Agent 分层**：`lib/agents/<name>.ts` 只写「prompt + 解析」纯函数；读库 → 调 agent → 落库在 `lib/agents/actions.ts`；展示面板在 `components/agents/<name>Panel.tsx`；`registry.ts` 是 Agent 元数据的单一事实来源。序列化一律走 `lib/serializers.ts`。
- **Human Gate**：AI 只提议不拍板；选方向（Gate 1）与最终审批（Gate 2）只能真人点击，决定落库并成为后续输入。

## 自治开发循环

本项目用于无人值守迭代开发。每一轮固定流程：

1. 读 `TASKS.md`，选优先级最高、未完成的一项（一次只做一项）。
2. 先读相关代码理解现状，遵守 `rules/CONTRIBUTING.md` 的目录 / 命名 / 序列化规范。
3. 实现。只做这一项，不顺手扩功能，不重写能跑的模块（见 `rules/AI_DEVELOPMENT_RULES.md` 铁律）。
4. 跑 `./verify.sh`。
5. 失败 → 自己定位、修复、重跑；**不得为了通过而削弱检查、跳过测试或硬编码**。
6. 全绿 → 用 `/code-review` 或独立 agent 对本次 diff 自查一遍。
7. 更新 `TASKS.md`（勾选完成项）+ `PROGRESS.md`（追加一条变更记录）。
8. `git add` 本次相关文件并 `git commit`。
9. 回到第 1 步，继续下一项。

### 什么时候停

- 任务本身需要真人决定（两道 Human Gate、付款、对外发布、删除真实数据等）
- 缺凭据
- 需求自相矛盾
- 破坏性 / 不可逆操作

其余情况一律继续，不要停下来问人。
