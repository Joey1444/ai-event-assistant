import { STATUS_LABELS } from "@/lib/status";

// 工作流正向推进的 10 个阶段（不含 REJECTED / REVISION_REQUIRED 两个终态）
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

export function WorkflowStepper({ current }: { current: string }) {
  const currentIndex = FLOW.findIndex((s) => s === current);

  return (
    <div className="flex items-center gap-1 overflow-x-auto pb-1">
      {FLOW.map((stage, i) => {
        const done = i < currentIndex;
        const active = i === currentIndex;
        return (
          <div key={stage} className="flex shrink-0 items-center">
            <span
              className={
                "rounded-full px-2.5 py-1 text-xs font-medium " +
                (active
                  ? "bg-gold text-paper"
                  : done
                    ? "bg-ink text-paper"
                    : "bg-paper-2 text-ink-soft")
              }
            >
              {done ? "✓ " : ""}
              {STATUS_LABELS[stage]}
            </span>
            {i < FLOW.length - 1 ? (
              <span className="mx-0.5 h-px w-2 bg-border" />
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
