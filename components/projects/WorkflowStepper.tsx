// 步骤条：左侧纵向导航，与页面面板一一对应、名称一致
const STEPS = [
  { id: "ai", label: "AI 连接", anchor: "#ai-connect" },
  { id: "detail", label: "项目详情", anchor: "#project-detail" },
  { id: "pm", label: "项目经理分析", anchor: "#panel-pm" },
  { id: "research", label: "资料调研", anchor: "#panel-research" },
  { id: "concept", label: "活动方案", anchor: "#panel-concept" },
  { id: "critic", label: "小莫评审", anchor: "#panel-critic" },
  { id: "factcheck", label: "事实核验", anchor: "#panel-facts" },
  { id: "decision", label: "请选择活动方向", anchor: "#panel-decision" },
  { id: "plan", label: "详细活动方案", anchor: "#panel-plan" },
  { id: "budget", label: "预算", anchor: "#panel-budget" },
  { id: "copy", label: "宣传文案", anchor: "#panel-copy" },
  { id: "poster", label: "海报图片", anchor: "#panel-poster" },
  { id: "approve", label: "最终审批", anchor: "#approve" },
] as const;

// 工作流状态 → 高亮的步骤
const CURRENT_STEP: Record<string, string> = {
  DRAFT: "pm",
  PM_ANALYSIS: "pm",
  RESEARCH: "research",
  CONCEPT: "concept",
  REVIEW: "critic",
  HUMAN_DECISION: "decision",
  HUMAN_DECISION_COMPLETED: "plan",
  PLANNING: "plan",
  PRODUCTION: "budget",
  FINAL_REVIEW: "approve",
  APPROVED: "approve",
};

export function WorkflowStepper({
  current,
  aiHealthy,
}: {
  current: string;
  aiHealthy: boolean;
}) {
  const currentId = CURRENT_STEP[current] ?? "pm";
  const currentIndex = STEPS.findIndex((s) => s.id === currentId);

  return (
    <nav className="flex flex-col gap-1">
      {STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isAi = step.id === "ai";
        const marker = isAi ? (aiHealthy ? "✓" : "!") : done ? "✓" : String(i + 1);

        return (
          <a
            key={step.id}
            href={step.anchor}
            className={
              "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium " +
              (active
                ? "bg-gold text-paper"
                : done
                  ? "text-ink hover:bg-paper-2"
                  : "text-ink-soft hover:bg-paper-2")
            }
          >
            <span
              className={
                "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs " +
                (isAi
                  ? aiHealthy
                    ? "bg-green-100 text-green-700"
                    : "bg-cinnabar-soft text-cinnabar"
                  : active
                    ? "bg-paper/30 text-paper"
                    : done
                      ? "bg-ink text-paper"
                      : "bg-paper-2 text-ink-soft")
              }
            >
              {marker}
            </span>
            {step.label}
          </a>
        );
      })}
    </nav>
  );
}
