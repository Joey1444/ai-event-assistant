"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { rejectAllConcepts, selectConcept } from "@/lib/agents/actions";
import {
  CRITIQUE_SCORE_LABELS,
  CRITIQUE_SCORE_ORDER,
  type ConceptData,
  type CritiqueData,
  type CritiqueScores,
  type DecisionData,
  type FactData,
} from "@/lib/agents/types";

export function HumanDecisionGate({
  projectId,
  concepts,
  critic,
  facts,
  decision,
}: {
  projectId: string;
  concepts: ConceptData[];
  critic: CritiqueData | null;
  facts: FactData[];
  decision: DecisionData | null;
}) {
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const riskFacts = facts.filter(
    (f) => f.status === "UNKNOWN" || f.status === "CONFLICT",
  );
  const alreadySelected = decision && !decision.rejected;
  const selectedConcept = concepts.find(
    (c) => c.variant === decision?.selectedConcept,
  );

  function handleSelect(variant: string) {
    setError(null);
    startTransition(async () => {
      const r = await selectConcept(projectId, variant, note || undefined);
      if (r.ok) {
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function handleReject() {
    setError(null);
    startTransition(async () => {
      const r = await rejectAllConcepts(projectId, note || undefined);
      if (r.ok) {
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section className="mt-8">
      <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">请选择活动方向</h2>

      {concepts.length === 0 ? (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          请先生成方案（上方「活动方案」→ 生成方案），然后在这里选择方向。
        </div>
      ) : alreadySelected ? (
        <div className="mt-3 rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          ✅ 已选择 Concept {decision?.selectedConcept}
          {selectedConcept ? ` · ${selectedConcept.direction}` : ""}
          {decision?.decisionNote ? `（备注：${decision.decisionNote}）` : ""}
        </div>
      ) : decision?.rejected ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          已 Reject All。如需重新选择，请先「重新生成方案」，再选择新的方向。
        </div>
      ) : (
        <>
          <div className="mt-3 flex flex-wrap gap-3 text-sm">
            {critic ? (
              <span className="rounded-full bg-ink px-3 py-1 text-xs font-medium text-paper">
                AI 推荐：Concept {critic.recommendedConcept}
              </span>
            ) : null}
            <span className="rounded-full bg-gold-soft px-3 py-1 text-xs font-medium text-gold">
              事实风险：{riskFacts.length} 条事实待核验（未知/冲突）
            </span>
          </div>

          {critic ? (
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 rounded-lg border border-border bg-card px-4 py-3 sm:grid-cols-4">
              {CRITIQUE_SCORE_ORDER.map((key) => {
                const item = critic.scores[key as keyof CritiqueScores];
                return (
                  <div key={key} className="text-xs">
                    <span className="text-ink-soft">
                      {CRITIQUE_SCORE_LABELS[key]}{" "}
                    </span>
                    <span className="font-semibold">{item.score}</span>
                  </div>
                );
              })}
            </div>
          ) : null}

          <div className="mt-3 space-y-3">
            {concepts.map((c) => {
              const recommended = critic?.recommendedConcept === c.variant;
              return (
                <div
                  key={c.variant}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="flex items-center justify-between">
                    <div className="font-medium text-ink">
                      Concept {c.variant} · {c.direction}
                    </div>
                    {recommended ? (
                      <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                        AI 推荐 ✓
                      </span>
                    ) : null}
                  </div>
                  <div className="mt-1 text-sm text-ink">{c.name}</div>
                  <div className="mt-1 text-xs text-ink-soft">
                    预算：{c.budgetRange || "—"}
                  </div>
                  <div className="mt-1 text-xs text-ink-soft">
                    主要优点：{truncate(c.pros)}
                  </div>
                  <div className="mt-1 text-xs text-ink-soft">
                    主要风险：{truncate(c.risks)}
                  </div>
                  <button
                    type="button"
                    onClick={() => handleSelect(c.variant)}
                    disabled={isPending}
                    className="mt-3 rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
                  >
                    选择 {c.variant}
                  </button>
                </div>
              );
            })}
          </div>

          <div className="mt-4">
            <label className="block text-sm font-medium text-ink">
              决策备注（可选）
            </label>
            <textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              rows={2}
              className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              placeholder="例如：选择 Concept B，但建议去掉月饼制作环节"
            />
          </div>

          <button
            type="button"
            onClick={handleReject}
            disabled={isPending}
            className="mt-2 rounded-lg border border-cinnabar-soft px-4 py-2 text-sm font-medium text-cinnabar hover:bg-cinnabar-soft disabled:opacity-50"
          >
            Reject All（全部驳回）
          </button>
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

function truncate(s: string, n = 90): string {
  return s.length > n ? s.slice(0, n) + "…" : s;
}
