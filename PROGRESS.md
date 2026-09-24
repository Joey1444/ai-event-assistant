# 进度记录

> 更新规则：每完成一轮自治循环，在「变更日志」顶部追加一条，并同步更新「当前状态」。日期用绝对日期。

## 当前状态（截至 2026-09-22）

- **状态**：MVP 核心功能完成，本地可运行（`npm run dev` → http://localhost:3000）
- **已完成**：16 张表的 Prisma schema；11 个 Agent（PM / Researcher / Strategist / Critic / FactChecker / Planner / Budget / Copywriter / Poster / PosterDesigner / QA）；2 道人工关卡；全部面板 UI；文本直连 DeepSeek 官方 API、文生图直连第三方 DashScope 原生 API；Researcher 联网调研（Tavily）；`/ai-test` 连通性测试
- **未完成**：见 `TASKS.md`（测试体系、海报导出、版本对比等）
- **已知坑**：Claude 沙箱跑 next build 报 EXDEV；npm 11 拦截 Prisma postinstall

## 变更日志

<!-- 每轮追加一行：`- [日期] 内容（提交 hash）` -->
- [2026-09-23] 新增 AI 网关模型配置界面（`/ai-test`）：网页表单配置文本/文生图模型的 baseURL/model/apiKey，写入项目 `.env`；`config.ts` 从模块常量改函数（`getAiConfig`/`getImageConfig`）支持保存后立即生效；apiKey 提交后只显示掩码（`****末4位`）不回明文；文生图默认模型 `wan2.7-image-pro`
- [2026-09-22] 三项用户反馈落地：事实核验人工确认后实时刷新顶部「下一步」计数（handleVerify 补 router.refresh）；预算面板支持编辑全字段 + 增删预算项；详细活动方案移除预算章节（16→15 章，审批页 FieldView 改遍历 labels 防旧数据泄漏）
- [2026-09-22] 重构 11 个 Agent 提示词（对齐 `docs/数据模型与数据流.md` + 高星项目写法）：`provider.ts` 加 system role、静态指令进 system/动态输入进 user；提示词改 XML 标签六段式 + 反幻觉四件套 + 事实可信度分层（USER_PROVIDED/FACT 可信、UNKNOWN/CONFLICT 标待确认）+ 复杂 Agent 加思考段；修正规则文档 maxTokens 统一 300000；修正 registry copywriter 文案数量 9→4
- [2026-09-22] 沉淀 `docs/数据模型与数据流.md`（表关系结构 + 提示词数据流，遵循「只写结构原则、链接代码」规范）
- [2026-09-22] 表关系/数据流审查（3 个审查 agent 因余额不足 402 失败，改本会话自查）+ 两处修复：事实核验改为软提醒（「下一步」提示还有 N 条待人工核验，不硬拦）；重新生成方案清空旧 Decision（修复 selectedConcept 软引用静默失效）；其余中低优先级项（Fact 无显式 kind、软引用、无鉴权、注入风险）记录待办
- [2026-09-22] 流水线重排 + 表格对齐：事实核验移到选方向之后（只核验选中方案，不再同时管 3 个方向，`factCheckProject` 要求先有 Decision）；侧边栏锚点定位加 `scroll-margin-top`；预算表格数字加 `tabular-nums` 等宽对齐 + 单价列去冗余币种
- [2026-09-22] 修复事实流转三处问题：调研事实不再被核验事实覆盖（`checkedAt` 分流，两面板各显各的）；事实核验不再把方案预算范围误判 UNKNOWN（提示词规则 9）；事实人工核验落地（`verification`/`humanNote` 字段 + `verifyFact` action + 确认/驳回/补充说明 UI，事实状态机 human_verified/rejected 落库）
- [2026-09-22] 详情页 UI 重构（基于代码审查反馈，5 个批次）：去掉面板嵌套滚动 + 删除确认改 modal + 详细方案折叠；序号单一事实来源（`lib/steps.ts` + `StepHeading`）+ 边栏步骤条打磨；预算表减负 + 海报面板结果优先；状态色 token 化（`ok`/`info`）+ 事实核验去重分组；文案单字段复制等打磨项
- [2026-09-21] 接入文生图 + 新增 PosterDesigner Agent + 删除 Designer：`generateImage()` 直连第三方 DashScope 原生 API（key 走 `EP_IMAGE_API_*` 服务端 env，含 MIME 魔数校验）；新增 `posterDesigner` agent（海报文案→文生图提示词，首图/图生图双模式）；新增 `PosterImage` 表（历史版本对比 + 基于上一张图修改）；删除 designer（HTML 海报）及其全部引用；表数 16→16（PosterDesign→PosterImage）
- [2026-09-20] 同步文档：Researcher Agent 已实现（`researcher.ts` + `ResearcherPanel` + registry/actions 接入，Tavily 联网检索）；README/TASKS 补齐 Researcher 与 `EP_TAVILY_API_KEY`；prisma 表数 18→16
- [2026-09-15] 建立自治循环（CLAUDE.md / TASKS.md / PROJECT_SPEC.md / PROGRESS.md / verify.sh），`git init`，修基线 9 个 lint 错误（8×prefer-const + 1×`<a>`→`<Link>`）；typecheck + lint 已全绿（未提交）
