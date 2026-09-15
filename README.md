# AI 活动策划助手（Event Planner MVP）

一个面向新手的 AI 活动策划工具，用「**AI 提议 + 人类决定**」的方式，把一次活动从需求分析一路推进到最终审批。

首个实战场景：**莫伊大学孔子学院 2026 年中秋节活动策划**。

---

## 这是什么

用户填写活动简报（名称、机构、日期、预算、地点、人群等），系统随后调用多个 AI Agent 依次完成：需求分析 → 方案设计 → 评审 → 事实核验 → 详细方案 → 预算 → 文案 → 海报 → 最终质检，中间有两道**必须真人点击**的审批关卡。AI 全程只提议、不拍板。

## 核心原则

1. **AI 永远不替人类做最终决定**——两道 Human Gate（选方向、最终批准）只能由用户点击。
2. **不把 AI 假设当事实**——所有外部信息要么有来源，要么标 `UNKNOWN` / `ASSUMPTION` / `CONFLICT`，绝不凭常识断定。
3. **不编造**——日期、地点、联系人、电话、费用、报名方式缺失时用 `[待确认]` 占位。
4. 完整规则见 [AI_DEVELOPMENT_RULES.md](AI_DEVELOPMENT_RULES.md)。

## 技术栈

- **Next.js 16**（App Router）+ **TypeScript** + **Tailwind CSS 4**
- **Prisma 6** + **SQLite**
- **统一 AI Provider 层**（`lib/ai/provider.ts`），通过 **CCSwitch 网关**访问模型（当前为 DeepSeek `deepseek-v4-pro`）
- 架构说明见 [docs/AI接入说明.md](docs/AI接入说明.md)

架构链路：

```
Web App → lib/ai/provider.ts (generateText) → CCSwitch (127.0.0.1:15721) → DeepSeek
```

业务代码零 Provider 绑定；换模型只改 CCSwitch 配置和 `AI_MODEL`。

## 已实现的 Agent（10 个 + 2 道人工关卡）

| Agent | 文件 | 产出 |
|---|---|---|
| PM（项目经理） | `lib/agents/pm.ts` | 已知/未知/假设/下一步分析 |
| Strategist（策划师） | `lib/agents/strategist.ts` | 三个方向不同的方案 A/B/C |
| Critic（评审） | `lib/agents/critic.ts` | 8 维评分 + 问题 + 推荐 |
| Fact Checker（事实核查） | `lib/agents/factChecker.ts` | 外部事实 + FACT/ASSUMPTION/UNKNOWN/CONFLICT 分类 |
| Planner（详细方案） | `lib/agents/planner.ts` | 16 章节正式方案 |
| Budget（预算） | `lib/agents/budget.ts` | 10 类预算项 + 自动合计 |
| Copywriter（文案） | `lib/agents/copywriter.ts` | 9 项宣传文案 |
| Poster（海报内容） | `lib/agents/poster.ts` | 10 项海报字段 |
| Web Design（海报设计） | `lib/agents/designer.ts` | 完整 HTML/CSS 海报 |
| Final QA（最终质检） | `lib/agents/qa.ts` | PASS / WARNING / BLOCK |

**两道人工关卡**：
- **Human Gate 1**——「请选择活动方向」：用户在方案 A/B/C 中点击选择（或 Reject All），系统绝不自动选。
- **Human Gate 2**——「最终人工审批」：用户点击 APPROVE / REJECT / REQUEST CHANGES。

## 完整工作流

```
创建项目
  → PM 分析（已知/未知/假设）
  → 生成三个方案 A/B/C
  → AI 评审（打分 + 推荐）
  → 事实核验（外部事实分类）
  → 🧑 Human Gate 1：人工选择方向
  → 生成 16 章节详细方案
  → 生成预算（10 类 + 自动合计）
  → 生成宣传文案（9 项）
  → 生成海报内容 + HTML 海报设计
  → Final QA（PASS/WARNING/BLOCK）
  → 🧑 Human Gate 2：最终批准 / 驳回 / 要求修改
```

## 快速开始

### 环境要求

- Node.js 22+
- 已安装并**正在运行**的 [CCSwitch](https://github.com/cresseelia/ccswitch)（AI 网关，本机实测用 cc-switch 桌面版，监听 `127.0.0.1:15721`）

### 步骤

```bash
# 1. 安装依赖
npm install

# 2. 配置环境变量（复制 .env.example 为 .env 并填写）
cp .env.example .env

# 3. 生成 Prisma 客户端 + 建库
npx prisma generate
npx prisma db push

# 4. 启动
npm run dev
```

浏览器打开 `http://localhost:3000`。

> 若换机器重装依赖后，需重跑 `npx prisma generate && npx prisma db push` 重建数据库（npm 11 默认拦截安装脚本，Prisma 的 postinstall 不会自动跑）。

### 测试 AI 连接

打开 `http://localhost:3000/ai-test`，点「Test AI」，看到 `Status: CONNECTED` 和 `Response: AI connection successful.` 即代表网关通了。

## 环境变量（.env）

```bash
DATABASE_URL="file:./dev.db"        # SQLite
AI_BASE_URL=http://127.0.0.1:15721  # CCSwitch 网关地址
AI_API_KEY=cc-switch-local          # 占位即可，真实 Key 由 CCSwitch 持有
AI_MODEL=deepseek-v4-pro            # 当前模型
```

> 项目**不直接持有任何模型 Provider 的 Key**，也不要把 DeepSeek Key 写进前端、数据库或 `.env.example`。

## 目录结构

### 页面（`app/`）

| 文件 | 功能 |
|---|---|
| `app/layout.tsx` | 根布局：中文 `<html>`、系统字体、全局标题 |
| `app/globals.css` | 全局样式：Tailwind 4 + 中文字体栈 |
| `app/page.tsx` | 首页：项目列表（名称 / 状态 / 更新时间）+ 新建入口 |
| `app/projects/new/page.tsx` | 创建项目：11 字段表单 |
| `app/projects/[id]/page.tsx` | 项目详情：挂载全部 Agent 面板 + 编辑/删除 |
| `app/projects/[id]/edit/page.tsx` | 编辑项目：复用同一表单 |
| `app/projects/[id]/approve/page.tsx` | 最终人工审批页（Human Gate 2） |
| `app/ai-test/page.tsx` | AI 网关连通性测试（Test AI） |

### AI Provider 层（`lib/ai/`）

| 文件 | 功能 |
|---|---|
| `lib/ai/config.ts` | AI 配置：baseURL / apiKey / model / timeout / maxTokens，从 `.env` 读 |
| `lib/ai/provider.ts` | 统一 `generateText()` + `checkAiHealth()` + `classifyError()`（错误分类成可读提示）。业务代码唯一调 AI 的入口 |
| `lib/ai/actions.ts` | `testAi()` 服务端 action（供 /ai-test 页用） |

### Agent 层（`lib/agents/`）

| 文件 | 功能 |
|---|---|
| `lib/agents/types.ts` | 共享类型 + 各 Agent 字段标签/常量 |
| `lib/agents/format.ts` | 格式化助手（DB 行 → Agent 输入文本） |
| `lib/agents/registry.ts` | Agent 注册表（单一事实来源） |
| `lib/agents/actions.ts` | 所有 Agent 的服务端 action（`analyzeProject` / `generateConcepts` / `runCritique` / `factCheckProject` / `selectConcept` / `generatePlan` / `generateBudget` / `generateCopy` / `generatePoster` / `generateDesign` / `runFinalQa` / `submitApproval`） |
| `lib/agents/pm.ts` | PM Agent：已知 / 未知 / 假设 / 下一步 |
| `lib/agents/strategist.ts` | Strategist Agent：三个方向方案 A/B/C |
| `lib/agents/critic.ts` | Critic Agent：8 维评分 + 优点/缺点/风险 + 推荐 |
| `lib/agents/factChecker.ts` | Fact Checker Agent：外部事实 + FACT/ASSUMPTION/UNKNOWN/CONFLICT 分类 |
| `lib/agents/planner.ts` | Planner Agent：16 章节正式活动方案 |
| `lib/agents/budget.ts` | Budget Agent：10 类预算项 + 摘要 + 成本风险 |
| `lib/agents/copywriter.ts` | Copywriter Agent：9 项宣传文案 |
| `lib/agents/poster.ts` | Poster Agent：10 项海报内容字段 |
| `lib/agents/designer.ts` | Web Design Agent：生成完整 HTML/CSS 海报 |
| `lib/agents/qa.ts` | Final QA Agent：PASS / WARNING / BLOCK |

### 数据与状态（`lib/`）

| 文件 | 功能 |
|---|---|
| `lib/db.ts` | Prisma 客户端单例（开发环境热重载防重复创建） |
| `lib/status.ts` | 项目状态常量 + 中文标签 + 徽章颜色 |
| `lib/serializers.ts` | 序列化助手（DB 行 → 前端数据对象） |
| `lib/actions.ts` | 项目 CRUD 服务端 action（`createProject` / `updateProject` / `deleteProject`） |

### UI 组件（`components/`）

**设计系统原语（`ui/`）**

| 文件 | 功能 |
|---|---|
| `components/ui/Button.tsx` | 按钮（primary / secondary / danger） |
| `components/ui/Card.tsx` | 卡片容器 |
| `components/ui/Section.tsx` | 区块（标题 + 内容） |
| `components/ui/Field.tsx` | 表单字段（label + input） |
| `components/ui/Badge.tsx` | 状态/标记徽章 |

**项目组件（`projects/`）**

| 文件 | 功能 |
|---|---|
| `components/projects/ProjectForm.tsx` | 创建/编辑共用的项目表单 |
| `components/projects/DeleteProjectButton.tsx` | 二次确认删除按钮 |
| `components/projects/WorkflowStepper.tsx` | 工作流步骤条 |

**Agent 面板（`agents/`）**

| 文件 | 功能 |
|---|---|
| `components/agents/PmAnalysisPanel.tsx` | PM 分析面板 |
| `components/agents/ConceptPanel.tsx` | 方案面板（生成 + 查看 A/B/C） |
| `components/agents/CriticPanel.tsx` | AI 评审面板（8 维评分 + 推荐） |
| `components/agents/FactCheckPanel.tsx` | 事实核验面板 |
| `components/agents/HumanDecisionGate.tsx` | 人工选择方向（Human Gate 1） |
| `components/agents/DetailedPlanPanel.tsx` | 详细方案面板（编辑/重新生成/保存版本） |
| `components/agents/BudgetPanel.tsx` | 预算面板（自动合计 + 编辑） |
| `components/agents/CopyPanel.tsx` | 文案面板 |
| `components/agents/PosterPanel.tsx` | 海报内容面板 |
| `components/agents/PosterDesignPanel.tsx` | 网页海报设计面板（iframe 渲染 HTML） |
| `components/agents/FinalQaPanel.tsx` | Final QA 面板 |
| `components/agents/ApprovalPanel.tsx` | 最终审批三按钮（APPROVE / REJECT / REQUEST CHANGES） |
| `components/AiTestPanel.tsx` | Test AI 按钮（网关测试） |

### 数据库（`prisma/`）

| 文件 | 功能 |
|---|---|
| `prisma/schema.prisma` | 数据模型（18 张表，见下节） |
| `prisma/dev.db` | SQLite 数据库文件（由 `prisma db push` 生成） |

### 根目录文件

| 文件 | 功能 |
|---|---|
| `README.md` | 本文件 |
| `AI_DEVELOPMENT_RULES.md` | 开发铁律（25 条 + 13 条补充） |
| `CONTRIBUTING.md` | 工程规范（目录结构 / 命名 / 如何新增 Agent） |
| `PROJECT_SPEC.md` | 验收标准（Definition of Done + 反幻觉 / AI 调用验收） |
| `TASKS.md` | 按优先级排序的待办清单 |
| `PROGRESS.md` | 进度记录（当前状态 + 变更日志） |
| `verify.sh` | 迭代验证闸门（typecheck + lint + build） |
| `AGENTS.md` | Next.js 自动生成的 AI 说明（**勿手改**，会被 `next dev` 重新生成） |
| `CLAUDE.md` | 自治开发循环 + 引用 `AGENTS.md` / `AI_DEVELOPMENT_RULES.md` / `CONTRIBUTING.md` 等 |
| `.env` / `.env.example` | 环境变量（数据库 + AI 网关） |
| `.npmrc` | 固定官方 npm 源 |
| `docs/AI接入说明.md` | AI 网关接入说明 |
| `docs/提示词说明.md` | 各 Agent 的角色 / 输入 / 输出 / 规则文档 |
| `package.json` / `tsconfig.json` / `next.config.ts` / `postcss.config.mjs` / `eslint.config.mjs` | 工程配置 |

## 数据模型

核心表：`Project`、`ProjectBrief`、`PmAnalysis`、`ResearchItem`（研究库）、`Fact`（事实账本）、`Concept`（方案）、`Critique`（评审）、`Decision`（人工决策）、`ActivityPlan`（详细方案）、`Budget`/`BudgetItem`（预算）、`Copy`（文案）、`Poster`（海报内容）、`PosterDesign`（海报 HTML）、`FinalQa`、`Approval`（最终审批）。

## 已知说明 / 踩坑记录

- **`deepseek-v4-pro` 是推理模型**，会先"思考"再输出。复杂 Agent 需要 `max_tokens ≥ 16000`，否则输出会被截断（`stop_reason=max_tokens`）。
- **`next build`/`next dev` 在 Claude 沙箱里跑会报 EXDEV**（写 `%APPDATA%\nextjs-nodejs` 失败），你自己的终端里无此问题。
- **杀毒/清理程序可能清空 `node_modules`**：若报「`next` 不是内部或外部命令」，重跑 `npm install` 即可。
- **「资料研究（Researcher）」尚未实现**：`ResearchItem` 表已建好，但自动联网调研的 Agent 是后续步骤；当前研究库和事实账本为空时，各 Agent 会把所有外部信息严格标为 `UNKNOWN`/`ASSUMPTION`。

## 下一步可做的事

- 实现 Researcher Agent（自动联网调研，填充 ResearchItem / Fact 账本）
- 海报导出 PNG / PDF、多套设计主题、接入文生图模型
- 预算、文案等模块的历史版本对比界面
