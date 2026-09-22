import { STATUS_LABELS } from "@/lib/status";

// 工作流正向推进的阶段（不含 REJECTED / REVISION_REQUIRED 两个终态）
const FLOW = [
  "DRAFT",
  "PM_ANALYSIS",
  "RESEARCH",
  "CONCEPT",
  "REVIEW",
  "HUMAN_DECISION",
  "HUMAN_DECISION_COMPLETED",
  "PLANNING",
  "PRODUCTION",
  "FINAL_REVIEW",
  "APPROVED",
] as const;

// 每个阶段跳转的页内锚点
const STEP_ANCHORS: Record<string, string> = {
  DRAFT: "#panel-pm",
  PM_ANALYSIS: "#panel-pm",
  RESEARCH: "#panel-research",
  CONCEPT: "#panel-concept",
  REVIEW: "#panel-critic",
  HUMAN_DECISION: "#panel-decision",
  HUMAN_DECISION_COMPLETED: "#panel-plan",
  PLANNING: "#panel-plan",
  PRODUCTION: "#panel-budget",
  FINAL_REVIEW: "#approve",
  APPROVED: "#approve",
};

export function WorkflowStepper({
  current,
  aiHealthy,
}: {
  current: string;
  aiHealthy: boolean;
}) {
  const currentIndex = FLOW.findIndex((s) => s === current);

  return (
    <nav className="flex flex-col gap-1">
      {/* AI 连接：工作流之前的第一步 */}
      <a
        href="#ai-connect"
        className={
          "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium " +
          (aiHealthy
            ? "text-green-700 hover:bg-paper-2"
            : "text-cinnabar hover:bg-paper-2")
        }
      >
        <span
          className={
            "flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-xs " +
            (aiHealthy
              ? "bg-green-100 text-green-700"
              : "bg-cinnabar-soft text-cinnabar")
          }
        >
          {aiHealthy ? "✓" : "!"}
        </span>
        AI 连接
      </a>

      <div className="my-1 h-px bg-border" />

      {FLOW.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <a
            key={stage}
            href={STEP_ANCHORS[stage] ?? "#"}
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
                (active
                  ? "bg-paper/30 text-paper"
                  : done
                    ? "bg-ink text-paper"
                    : "bg-paper-2 text-ink-soft")
              }
            >
              {done ? "✓" : i + 1}
            </span>
            {STATUS_LABELS[stage]}
          </a>
        );
      })}
    </nav>
  );
}
