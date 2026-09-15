# 任务清单（TASKS）

> 规则：始终取优先级最高、未勾选的一项开始。完成后勾选、更新 `PROGRESS.md`、提交，再取下一项。
> 验收标准细节见 `PROJECT_SPEC.md`。

## Phase 0 — 补齐地基（先做）

- [ ] 初始化 git 仓库并做首次提交（项目当前**没有 .git**，提交闭环的前提）
- [ ] 引入测试框架（Vitest 或 Jest）+ 一个冒烟测试；在 `package.json` 加 `test` script，并把测试接入 `verify.sh`
- [ ] 让 `./verify.sh` 在干净环境可跑（确认 `npx prisma generate` 之后 typecheck 能过）

## Phase 1 — 核心缺口（高价值）

- [ ] **Researcher Agent**：自动联网调研，填充 `ResearchItem` / `Fact` 账本（README 标注「尚未实现」）
  - 验收：走 `lib/ai/provider.ts`；产出入库；来源可追溯；无来源标 UNKNOWN；有独立面板入口
- [ ] 逐个体检 10 个 Agent 的 JSON 解析是否防御性（规则 36）：注入畸形 JSON → 得到可读错误、页面不崩
- [ ] `Fact` 状态机落地校验：unverified → ai_checked → human_verified / rejected，AI 不得自行标 human_verified（规则 29）

## Phase 2 — 增强

- [ ] 海报导出 PNG / PDF
- [ ] 多套海报设计主题
- [ ] 预算 / 文案 / 详细方案的历史版本对比界面
- [ ] （可选）接入文生图模型

## Phase 3 — 质量与测试

- [ ] provider 层单测（config / generateText / classifyError）
- [ ] 各 Agent 解析器单测（用固定 JSON 样本测类型与取值范围校验）
- [ ] 集成测试：agent → action → 落库 → 读回
- [ ] E2E：创建项目 → 全流程 → 两道 Human Gate → 审批
