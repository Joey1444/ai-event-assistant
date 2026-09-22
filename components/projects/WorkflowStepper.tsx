import { WORKFLOW_STEPS } from "@/lib/steps";

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
  const currentIndex = WORKFLOW_STEPS.findIndex((s) => s.id === currentId);

  return (
    <nav className="flex flex-col" aria-label="工作流步骤">
      {WORKFLOW_STEPS.map((step, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        const isAi = step.id === "ai";
        const isLast = i === WORKFLOW_STEPS.length - 1;

        return (
          <div key={step.id} className="flex">
            {/* 左侧轨迹：数字圆点 + 连接线 */}
            <div className="flex flex-col items-center">
              <span
                className={
                  "flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-xs font-semibold " +
                  (active
                    ? "bg-gold text-paper"
                    : done
                      ? "bg-ink text-paper"
                      : "border border-border bg-paper-2 text-ink-soft")
                }
              >
                {i + 1}
              </span>
              {!isLast ? <span className="my-0.5 w-px flex-1 bg-border" /> : null}
            </div>
            <a
              href={step.anchor}
              aria-current={active ? "step" : undefined}
              className={
                "ml-2.5 flex flex-1 items-center gap-1.5 rounded-lg py-1.5 pr-2 text-sm font-medium " +
                (active
                  ? "border border-gold bg-gold-soft text-ink"
                  : done
                    ? "text-ink hover:bg-paper-2"
                    : "text-ink-soft hover:bg-paper-2")
              }
            >
              {step.label}
              {isAi ? (
                <span
                  className={
                    "ml-0.5 h-2 w-2 shrink-0 rounded-full " +
                    (aiHealthy ? "bg-green-500" : "bg-cinnabar")
                  }
                  title={aiHealthy ? "AI 已连接" : "AI 未连接"}
                />
              ) : null}
            </a>
          </div>
        );
      })}
    </nav>
  );
}
