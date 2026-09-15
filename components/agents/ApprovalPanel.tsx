"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { submitApproval } from "@/lib/agents/actions";
import type { ApprovalData } from "@/lib/agents/types";

const DECISION_LABELS: Record<string, string> = {
  APPROVED: "已批准",
  REJECTED: "已驳回",
  REVISION_REQUIRED: "需修改",
};

export function ApprovalPanel({
  projectId,
  savedApproval,
}: {
  projectId: string;
  savedApproval: ApprovalData | null;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handle(decision: "APPROVED" | "REJECTED" | "REVISION_REQUIRED") {
    setError(null);
    startTransition(async () => {
      const r = await submitApproval(projectId, decision, note || undefined);
      if (r.ok) {
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section className="mt-8 rounded-xl border border-ink bg-card p-6">
      <h2 className="text-lg font-bold text-ink">最终批准</h2>
      <p className="mt-1 text-sm text-ink-soft">
        最终审批只能由你（用户）完成，AI 不能代替你决定。
      </p>

      {savedApproval ? (
        <div className="mt-4 rounded-lg border border-border bg-paper-2 px-4 py-3 text-sm">
          已作出决定：<span className="font-semibold">{DECISION_LABELS[savedApproval.decision] ?? savedApproval.decision}</span>
          {savedApproval.approvalNote ? `（备注：${savedApproval.approvalNote}）` : ""}
        </div>
      ) : (
        <>
          <label className="mt-4 block text-sm font-medium text-ink">
            审批备注（可选）
          </label>
          <textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            rows={2}
            className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
            placeholder="例如：预算需再核对，其余可发布"
          />

          <div className="mt-4 flex flex-wrap gap-3">
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handle("APPROVED")}
                disabled={isPending}
                className="rounded-lg bg-green-600 px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50"
              >
                批准
              </button>
              <p className="text-xs text-ink-soft">流程结束，项目定稿</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handle("REJECTED")}
                disabled={isPending}
                className="rounded-lg bg-cinnabar px-5 py-2.5 text-sm font-semibold text-paper hover:bg-cinnabar-soft0 disabled:opacity-50"
              >
                驳回
              </button>
              <p className="text-xs text-ink-soft">打回重做，需重新生成方案</p>
            </div>
            <div className="flex flex-col items-center gap-1">
              <button
                type="button"
                onClick={() => handle("REVISION_REQUIRED")}
                disabled={isPending}
                className="rounded-lg bg-gold-soft0 px-5 py-2.5 text-sm font-semibold text-paper hover:opacity-90 disabled:opacity-50"
              >
                要求修改
              </button>
              <p className="text-xs text-ink-soft">退回修改后重新审批</p>
            </div>
          </div>
        </>
      )}

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}
    </section>
  );
}
