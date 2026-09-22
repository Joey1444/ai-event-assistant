# 开发规范（CONTRIBUTING）

本文档约定本项目的目录结构、命名、以及如何新增一个 Agent。

## 目录结构

```
app/                     # 页面（路由）
  page.tsx               # 首页：项目列表
  projects/              # 项目：新建 / 详情 / 编辑 / 审批
  ai-test/               # AI 网关连通性测试
components/
  ui/                    # 设计系统原语（Button / Card / Section / Field / Badge）
  agents/                # 各 Agent 面板（客户端组件）
  projects/              # 项目通用组件（表单 / 删除 / 步骤条）
lib/
  ai/                    # AI Provider 抽象层（config / provider / actions）
  agents/
    pm.ts … qa.ts        # Agent 实现（prompt + 解析）
    format.ts            # 格式化助手（DB 行 → Agent 输入文本）
    actions.ts           # Agent 服务端 action（只放 action + 版本号助手）
    types.ts             # 类型 + 字段常量
    registry.ts          # Agent 注册表
  serializers.ts         # 序列化助手（DB 行 → 前端数据对象）
  db.ts                  # Prisma 单例
  status.ts              # 项目状态常量
  actions.ts             # 项目 CRUD 服务端 action
```

## 命名约定

- Agent 文件：`lib/agents/<小写名词>.ts`，导出 `run<Xxx>()` 函数（纯函数：输入 → 调 `generateText` → 返回解析后的数据）。
- 服务端 action：`lib/agents/actions.ts` 里导出 `<动词><名词>()`，负责读库 → 调 agent → 落库 → 返回可序列化结果。
- 面板组件：`components/agents/<Agent>Panel.tsx`（`"use client"`），负责「按钮 + 调 action + 展示」。
- 序列化：DB 行 → 前端数据对象的转换，一律放 `lib/serializers.ts`，不要在页面里重复写 `toXxx`。

## 如何新增一个 Agent（4 步）

1. **写 Agent**：在 `lib/agents/<name>.ts` 写提示词（角色/输入/输出/规则）+ `run<Name>()` + JSON 解析。
2. **加 action**：在 `lib/agents/actions.ts` 加 `<动词><Name>()`，复用 `lib/agents/format.ts` 里的 `formatBrief/formatResearch/formatFacts/formatPlanText` 等格式化助手。
3. **加面板**：在 `components/agents/<Name>Panel.tsx` 写客户端组件（`useTransition` 调 action）。
4. **注册**：在 `lib/agents/registry.ts` 的 `AGENTS` 数组里加一条 meta，并在项目详情页挂载面板。

## 提示词规范

- 统一骨架：XML 标签分段 `<角色>` / `<任务>` / `<输出>` / `<规则>`（复杂 Agent 再加 `<思考>`，少数加 `<示例>`）；静态指令进 system、动态输入进 user。
- 反幻觉：绝不编造；无来源标 `UNKNOWN`/`[待确认]`；推测标 `ASSUMPTION`；冲突标 `CONFLICT`。
- 所有 Agent 统一 `maxTokens: 300000`（`deepseek-v4-pro` 是推理模型，token 给少了会截断，统一给足）。
- 反幻觉与 maxTokens 的完整铁律见 `rules/AI_DEVELOPMENT_RULES.md`（唯一权威），本处只做「写提示词」的速记提醒。

## 序列化规范

- 所有「数据库行 → 前端数据对象」的转换，都 import `lib/serializers.ts` 里的 `toXxx` / `parseArr` / `parseFindings`。
- 不要在页面/组件里重复定义这些转换函数。

## 文档规范（单一事实来源）

- **代码是唯一事实来源**：md 里禁止复制「会随代码变化的事实」——Agent 清单、字段清单、数据表名/表数、环境变量名/值——只能链接到对应代码文件（`lib/agents/registry.ts` / `prisma/schema.prisma` / `.env.example` / 各 `lib/agents/*.ts`）。
- 新增 / 修改 Agent、字段、表、env 时**只改代码，不改任何 md**；md 只写「不变的结构、原则、导航」。
- 链接不会过期，复制来的文本会过期。发现 md 里出现可漂移的清单（Agent 表、字段数、表数），视为违规，应删掉改成链接。

## 文件职责（每个文件只干一件事）

| 文件 | 唯一职责 |
|---|---|
| `CLAUDE.md` | 给 Claude Code 的操作说明：命令 + 架构大图 + 自治循环 + 停止条件 |
| `rules/AI_DEVELOPMENT_RULES.md` | 开发铁律的**唯一权威**（反幻觉 / 唯一入口 / max_tokens / 事实状态机） |
| `rules/CONTRIBUTING.md` | 工程规范：目录 / 命名 / 文档规范 / 如何新增 Agent |
| `rules/PROJECT_SPEC.md` | 验收标准（怎么算做完） |
| `TASKS.md` | 待办清单的**唯一来源**（所有 backlog 都汇总到这里） |
| `PROGRESS.md` | 进度日志（当前状态 + 变更记录） |
| `README.md` | 给人类的「前门」介绍（是什么 / 怎么跑 / 踩坑） |
| `AGENTS.md` | Next.js 自动生成（**勿手改**） |
| `docs/` | 人类向解释说明（AI 网关接入、提示词约定） |
| 代码（`lib/` / `prisma/` / `.env.example`） | 事实的唯一来源，md 不复制、只链接 |
