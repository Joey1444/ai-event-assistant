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
- 面板组件：`components/<Agent>Panel.tsx`（`"use client"`），负责「按钮 + 调 action + 展示」。
- 序列化：DB 行 → 前端数据对象的转换，一律放 `lib/serializers.ts`，不要在页面里重复写 `toXxx`。

## 如何新增一个 Agent（4 步）

1. **写 Agent**：在 `lib/agents/<name>.ts` 写提示词（角色/输入/输出/规则）+ `run<Name>()` + JSON 解析。
2. **加 action**：在 `lib/agents/actions.ts` 加 `<动词><Name>()`，复用 `lib/agents/format.ts` 里的 `formatBrief/formatResearch/formatFacts/formatPlanText` 等格式化助手。
3. **加面板**：在 `components/agents/<Name>Panel.tsx` 写客户端组件（`useTransition` 调 action）。
4. **注册**：在 `lib/agents/registry.ts` 的 `AGENTS` 数组里加一条 meta，并在项目详情页挂载面板。

## 提示词规范

- 统一骨架：`# 角色` / `# 输入` / `# 输出` / `# 规则`。
- 反幻觉：绝不编造；无来源标 `UNKNOWN`/`[待确认]`；推测标 `ASSUMPTION`；冲突标 `CONFLICT`。
- 复杂 Agent 的 `maxTokens` 用 16000，简单 Agent 用 8000（`deepseek-v4-pro` 是推理模型，token 给少了会截断）。

## 序列化规范

- 所有「数据库行 → 前端数据对象」的转换，都 import `lib/serializers.ts` 里的 `toXxx` / `parseArr` / `parseFindings`。
- 不要在页面/组件里重复定义这些转换函数。
