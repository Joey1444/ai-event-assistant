# 项目规格与验收标准

> 功能规格（是什么 / 工作流 / 数据模型）见 `README.md`；开发铁律见 `rules/AI_DEVELOPMENT_RULES.md`；工程规范见 `rules/CONTRIBUTING.md`。
> 本文件只回答一个问题：**怎么算做完**——把主观判断换成可验证标准。

## 通用 Definition of Done（任何任务都适用）

一个任务「完成」必须同时满足：

1. `npx tsc --noEmit` 通过
2. `npm run lint` 通过
3. `npm run build` 通过
4. 未削弱任何现有功能；未删除已有模块；未硬编码值去迎合检查
5. 未新增非 MVP 必需的依赖（能用原生 fetch / 标准库就不引包）
6. 遵循 `rules/CONTRIBUTING.md` 的目录 / 命名 / 序列化规范
7. 遵守 `rules/AI_DEVELOPMENT_RULES.md` 铁律（尤其反幻觉、显式 max_tokens、统一 provider 入口）
8. 相关文档同步（README / docs/）
9. `git commit`

## 反幻觉验收（每个 AI 输出都要过）

- 无来源 → `UNKNOWN` 或 `[待确认]`
- 推测 → `ASSUMPTION`
- 冲突 → `CONFLICT`，且**保留冲突双方原文**，不只给结论
- 绝不把 AI 假设标成 `human_verified`；human_verified 只能由真人点击产生

## AI 调用验收

- 唯一入口：`lib/ai/provider.ts` 的 `generateText()`；业务代码 / Agent 不得直接 fetch 模型端点
- 必须显式设置 `max_tokens` 与 `timeout`（简单 Agent ≥ 8000，复杂 Agent ≥ 12000–16000）
- 模型输出 JSON 必须防御性解析：字段做类型与取值范围校验，失败给可读错误提示而非页面崩溃
- 业务代码不得出现 DeepSeek / OpenAI / Claude 等具体 Provider 专属逻辑；换模型只改 `AI_BASE_URL` / `AI_MODEL`

## 各待办任务的验收（对应 TASKS.md）

| 任务 | 可验证标准 |
|---|---|
| Researcher Agent | 产出写入 ResearchItem / Fact 且 source 可追溯；无来源标 UNKNOWN；面板可交互 |
| 防御性解析体检 | 对每个 Agent 注入畸形 JSON → 得到可读错误、页面不崩 |
| Fact 状态机 | AI 输出只能到 ai_checked；human_verified 只能来自真人点击 |
| 测试体系 | `npm test` 全绿且接入 verify.sh；关键路径有覆盖 |
| 海报图片导出 | 能从海报图片面板下载生成的 PNG 图片 |
