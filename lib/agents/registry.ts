// Agent 注册表：所有 Agent 的单一事实来源（用于文档、面板、以及后续可能的自动编排）。
export type AgentMeta = {
  id: string;
  name: string;
  role: string;
  file: string;
  input: string;
  output: string;
  requiresPlan: boolean; // 是否依赖「详细活动方案」
  humanGate?: boolean; // 是否为人工关卡
};

export const AGENTS: AgentMeta[] = [
  {
    id: "pm",
    name: "项目经理",
    role: "给项目简报做信息体检：找出主要矛盾（阻塞项）与次要提醒",
    file: "pm.ts",
    input: "项目简报",
    output: "summary / blockers / minorGaps / assumptions / nextStep / canStart",
    requiresPlan: false,
  },
  {
    id: "researcher",
    name: "资料调研",
    role: "联网调研，填充研究库与事实账本",
    file: "researcher.ts",
    input: "项目简报 + 联网检索",
    output: "研究条目 + 事实（带来源）",
    requiresPlan: false,
  },
  {
    id: "strategist",
    name: "策划师",
    role: "设计 2~4 个方向不同的活动方案",
    file: "strategist.ts",
    input: "简报 / 研究 / 事实账本",
    output: "2~4 个方案 × 17 字段（含 differentiator）",
    requiresPlan: false,
  },
  {
    id: "critic",
    name: "评审",
    role: "给多个方案找问题 + 8 维评分 + 推荐",
    file: "critic.ts",
    input: "三方案 / 简报 / 研究 / 事实账本",
    output: "8 维评分 / 优缺点 / 风险 / 推荐",
    requiresPlan: false,
  },
  {
    id: "humanGate1",
    name: "人工选择方向",
    role: "用户在多个方案中点击选择（系统不自动选）",
    file: "actions.ts (selectConcept)",
    input: "三方案 + 评审",
    output: "Decision 记录",
    requiresPlan: false,
    humanGate: true,
  },
  {
    id: "factChecker",
    name: "事实核查",
    role: "找出外部事实并分类 FACT/ASSUMPTION/UNKNOWN/CONFLICT",
    file: "factChecker.ts",
    input: "所选方案 / 简报 / 研究 / 事实账本",
    output: "事实列表 + 分类 + 是否需人工核验",
    requiresPlan: false,
  },
  {
    id: "planner",
    name: "详细方案策划师",
    role: "把已选方案展开成 16 章节可执行方案",
    file: "planner.ts",
    input: "已选方案 / 简报 / 研究 / 事实账本",
    output: "16 章节方案",
    requiresPlan: false,
  },
  {
    id: "budget",
    name: "预算规划师",
    role: "生成 10 类预算项 + 自动合计 + 价格来源标注",
    file: "budget.ts",
    input: "详细方案 / 简报 / 研究 / 事实账本",
    output: "预算项 / 摘要 / 成本风险",
    requiresPlan: true,
  },
  {
    id: "copywriter",
    name: "文案策划师",
    role: "产出 4 种不同用途与语气的宣传文案",
    file: "copywriter.ts",
    input: "详细方案 / 简报 / 事实账本",
    output: "4 项文案",
    requiresPlan: true,
  },
  {
    id: "poster",
    name: "海报设计师",
    role: "提炼海报文案与视觉要素",
    file: "poster.ts",
    input: "详细方案 / 简报 / 事实账本",
    output: "10 项海报字段",
    requiresPlan: true,
  },
  {
    id: "posterDesigner",
    name: "海报视觉设计",
    role: "把海报文案转成文生图提示词，并生成/迭代海报图片",
    file: "posterDesigner.ts",
    input: "海报文案 / 简报 / 修改指令",
    output: "海报图片（支持历史版本对比 + 图生图修改）",
    requiresPlan: true,
  },
  {
    id: "finalQa",
    name: "Final QA",
    role: "发布前最后一道检查，输出 PASS/WARNING/BLOCK",
    file: "qa.ts",
    input: "整个项目",
    output: "result / summary / 10 项 findings",
    requiresPlan: true,
  },
  {
    id: "humanGate2",
    name: "最终审批",
    role: "用户点击 APPROVE/REJECT/REQUEST CHANGES（系统不模拟）",
    file: "actions.ts (submitApproval)",
    input: "整个项目 + Final QA",
    output: "Approval 记录",
    requiresPlan: true,
    humanGate: true,
  },
];
