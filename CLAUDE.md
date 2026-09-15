@AGENTS.md
@AI_DEVELOPMENT_RULES.md
@CONTRIBUTING.md
@PROJECT_SPEC.md
@TASKS.md
@PROGRESS.md

# 自治开发循环

本项目用于无人值守迭代开发。每一轮固定流程：

1. 读 `TASKS.md`，选优先级最高、未完成的一项（一次只做一项）。
2. 先读相关代码理解现状，遵守 `CONTRIBUTING.md` 的目录 / 命名 / 序列化规范。
3. 实现。只做这一项，不顺手扩功能，不重写能跑的模块（见 `AI_DEVELOPMENT_RULES.md` 铁律）。
4. 跑 `./verify.sh`（typecheck + lint + build）。
5. 失败 → 自己定位、修复、重跑；**不得为了通过而削弱检查、跳过测试或硬编码**。
6. 全绿 → 用 `/code-review` 或独立 agent 对本次 diff 自查一遍。
7. 更新 `TASKS.md`（勾选完成项）+ `PROGRESS.md`（追加一条变更记录）。
8. `git add` 本次相关文件并 `git commit`。
9. 回到第 1 步，继续下一项。

## 什么时候停

- 任务本身需要真人决定（两道 Human Gate、付款、对外发布、删除真实数据等）
- 缺凭据
- 需求自相矛盾
- 破坏性 / 不可逆操作

其余情况一律继续，不要停下来问人。

## 验证闸门

每轮必须以 `./verify.sh` 全绿结束。当前 verify.sh 只跑 typecheck + lint + build，**暂无单元测试**（补测试是 `TASKS.md` Phase 0 里的一项）。
