// 工作流步骤的单一事实来源：顺序 + 标签 + 页内锚点。
// 侧边栏（WorkflowStepper）与各面板标题（StepHeading）都从这里取序号与名称，
// 增删/调整步骤只改这一处。
export type WorkflowStep = {
  id: string;
  label: string;
  anchor: string;
};

export const WORKFLOW_STEPS: WorkflowStep[] = [
  { id: "ai", label: "AI 连接", anchor: "#ai-connect" },
  { id: "detail", label: "项目详情", anchor: "#project-detail" },
  { id: "pm", label: "项目经理分析", anchor: "#panel-pm" },
  { id: "research", label: "资料调研", anchor: "#panel-research" },
  { id: "concept", label: "活动方案", anchor: "#panel-concept" },
  { id: "critic", label: "小莫评审", anchor: "#panel-critic" },
  { id: "factcheck", label: "事实核验", anchor: "#panel-facts" },
  { id: "decision", label: "选择方向", anchor: "#panel-decision" },
  { id: "plan", label: "详细活动方案", anchor: "#panel-plan" },
  { id: "budget", label: "预算", anchor: "#panel-budget" },
  { id: "copy", label: "宣传文案", anchor: "#panel-copy" },
  { id: "poster", label: "海报图片", anchor: "#panel-poster" },
  { id: "approve", label: "最终审批", anchor: "#approve" },
];
