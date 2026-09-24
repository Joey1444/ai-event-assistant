# AI 活动策划助手（小莫）

> AI 提议 · 人类拍板 —— 面向海外中文教学机构的文化活动智能策划体

小莫用「**AI 提议 + 人类决定**」的方式，把一场文化活动从需求分析一路推进到最终审批：你填一份简报，11 个 AI 智能体分工完成方案、预算、文案、海报与质检，两道关键审批由你亲手点击。落地示例：莫伊大学孔子学院 2026 年中秋节活动策划。

## ✨ 特性

- 🧠 **一条流水线到底**：简报 → 方案 → 审批，11 个 AI 智能体依次推进，上一步产出自动成为下一步输入
- 🧑 **两道真人关卡**：选方向 / 最终审批，AI 只提议、永不替人拍板
- 🔍 **反幻觉护栏**：外部事实必须带来源，无来源标 UNKNOWN，可追溯、可人工核验
- ✏️ **产出全程可改**：方案 / 预算 / 文案 / 海报都能编辑、重生成、留历史版本
- 🔌 **模型可换**：改环境变量即可，业务代码零 Provider 绑定
- 🎨 **文生图海报**：文案自动转提示词出图，支持图生图迭代修改

## 🚀 快速开始

**面向用户（新手，推荐）**

```bash
# 1. 从 GitHub Releases 下载 event-planner-v1.0.0.zip 并解压
# 2. 首次：双击 setup.bat（自动装依赖 + 建库 + 复制 .env）
# 3. 之后每次：双击 start-share.bat 启动
```

**面向开发者**

```bash
npm install
cp .env.example .env          # 填模型 key
npx prisma generate && npx prisma db push
npm run dev
```

浏览器打开 `http://localhost:3000`。首次配置模型：打开 `/ai-test`，填文本 / 文生图模型的地址、模型名和 key（保存后 key 只显示掩码、不再明文显示）。

## 🧭 完整工作流

```
创建项目
  → PM 分析（已知 / 未知 / 假设）
  → 资料调研（联网检索，填充研究库 + 事实账本）
  → 生成多个方案（2~4 个）
  → AI 评审（打分 + 推荐）
  → 🧑 Human Gate 1：人工选择方向
  → 事实核验（只核验选中方案的外部事实）
  → 生成详细方案（15 章节）
  → 生成预算（10 类 + 自动合计）
  → 生成宣传文案（4 项，中英双语 + 社交媒体）
  → 生成海报文案 + 海报图片（文生图，支持历史版本与图生图修改）
  → Final QA（PASS / WARNING / BLOCK）
  → 🧑 Human Gate 2：最终批准 / 驳回 / 要求修改
```

## 核心原则

1. **AI 永不替人做最终决定**——两道 Human Gate 只能由用户点击。
2. **不把假设当事实**——外部信息要么有来源，要么标 `UNKNOWN` / `ASSUMPTION` / `CONFLICT`。
3. **不编造**——缺失信息用 `[待确认]` 占位。
4. 完整规则见 [AI_DEVELOPMENT_RULES.md](rules/AI_DEVELOPMENT_RULES.md)。

## 🔧 可自定义与扩展

<details>
<summary>「小莫」是一条可定制的流水线，可适配更多场景（点击展开）</summary>

### 模型提供方可自由更换

- 文本、文生图、联网检索三类能力都经统一网关（`lib/ai/provider.ts`）接入，业务代码零 Provider 绑定。
- 换模型只改环境变量，或在 `/ai-test` 页面直接填新模型的地址、模型名和 key。
- 文本默认 DeepSeek（OpenAI 兼容），文生图默认通义万相，均可换成其它兼容服务。

### AI 提示词可自行迭代

- 每个智能体的提示词集中在 `lib/agents/*.ts`，统一「角色 + 任务 + 输出 + 规则」结构，改提示词无需懂架构。
- 要把「中秋」改成「春节」「汉语角」「招生开放日」，只需调整提示词里的文化内容与活动示例，代码逻辑不动。
- 反幻觉、事实状态机等护栏是全局约定，改提示词时依然生效。

### 智能体可增删与替换

- 智能体清单唯一来源是 `lib/agents/registry.ts`；按「写提示词 → 加 action → 加面板 → 注册」四步即可新增一个智能体（详见 `rules/CONTRIBUTING.md`）。

### 数据模型与流程可扩展

- 数据模型在 `prisma/schema.prisma`，可加字段、加表；字段校验在 `lib/validation.ts`。
- 流水线顺序由注册表决定，步骤序号 / 标签由 `lib/steps.ts` 决定，「下一步该做什么」由 `lib/workflow.ts` 决定。

### 界面文案与外观可定制

- 步骤标签、状态中文名、字段名集中在 `lib/agents/types.ts`、`lib/steps.ts`、`lib/status.ts`。
- 配色走设计 token（`app/globals.css`），可整套换品牌色。

### 场景拓展示例

- **春节文化周 / 汉语角 / 招生开放日**：改提示词里的文化内容与活动示例即可。
- **教学计划 / 活动复盘 / 项目申报**：复用「简报 → 分析 → 方案 → 评审 → 审批」骨架，改简报字段和方案章节。

</details>

## 📚 文档导航

| 文件 | 是什么 |
|---|---|
| `rules/AI_DEVELOPMENT_RULES.md` | 开发铁律（AI 开发必须遵守） |
| `rules/CONTRIBUTING.md` | 工程规范（目录结构 / 命名 / 文档规范 / 如何新增 Agent） |
| `rules/PROJECT_SPEC.md` | 验收标准（怎么算做完） |
| `TASKS.md` | 按优先级排序的待办清单 |
| `PROGRESS.md` | 进度记录（当前状态 + 变更日志） |
| `CLAUDE.md` | 给 Claude Code 的说明（自治循环 + 命令 + 架构大图） |
| `docs/AI接入说明.md` | AI 接入用户说明书（怎么用上 AI） |
| `docs/提示词说明.md` | Agent 提示词约定（骨架 / 反幻觉原则） |
| `docs/数据模型与数据流.md` | 表关系 + 生成影响完整快照（技术文档底稿） |
| `docs/技术架构大纲.md` | 技术架构总纲（分层 / 数据流 / AI 网关 / 提示词 / 发布） |
| `docs/作品申报说明_润色稿.md` | 智能体作品申报说明（申报最终稿） |

## 🛠 技术栈与架构

- **Next.js 16**（App Router）+ **TypeScript** + **Tailwind CSS 4**；**Prisma 6** + **SQLite**。
- **统一 AI Provider 层**：文本直连 DeepSeek、文生图直连 DashScope、联网检索走 Tavily，业务代码零 Provider 绑定。
- 架构说明见 [docs/技术架构大纲.md](docs/技术架构大纲.md) 与 [docs/AI接入说明.md](docs/AI接入说明.md)。

## 贡献

欢迎提交 Issue 与 Pull Request。新增 Agent、改提示词、修 bug 前请先读 [rules/CONTRIBUTING.md](rules/CONTRIBUTING.md)。

环境要求：Node.js 20.9 或更高。
