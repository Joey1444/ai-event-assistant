"use client";

import { useState, useTransition } from "react";
import { factCheckProject } from "@/lib/agents/actions";
import { CONFIDENCE_LABELS, FACT_STATUS_LABELS, type FactData } from "@/lib/agents/types";

const STATUS_STYLES: Record<string, string> = {
  FACT: "bg-green-100 text-green-800",
  ASSUMPTION: "bg-gold-soft text-gold",
  UNKNOWN: "bg-paper-2 text-ink-soft",
  CONFLICT: "bg-cinnabar-soft text-cinnabar",
};

export function FactCheckPanel({
  projectId,
  savedFacts,
}: {
  projectId: string;
  savedFacts: FactData[];
}) {
  const [facts, setFacts] = useState<FactData[]>(savedFacts);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const r = await factCheckProject(projectId);
      if (r.ok) {
        setFacts(r.facts);
      } else {
        setError(r.error);
      }
    });
  }

  const critical = facts.filter((f) => f.requiresHumanVerification);

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">事实核验</h2>
        <button
          type="button"
          onClick={handleRun}
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isPending ? "核验中…" : facts.length > 0 ? "重新核验" : "事实核验"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {facts.length > 0 ? (
        <>
          <div className="mt-3 rounded-lg border border-gold bg-gold-soft px-4 py-3">
            <div className="text-sm font-semibold text-gold">
              需要人工确认的关键事实（{critical.length}）
            </div>
            {critical.length > 0 ? (
              <ul className="mt-2 list-disc pl-5 text-sm text-ink">
                {critical.map((f, i) => (
                  <li key={i} className="mt-1">
                    {f.claim}
                    <span className="ml-2 text-xs text-ink-soft">
                      [{FACT_STATUS_LABELS[f.status] ?? f.status}]
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">（无）</p>
            )}
          </div>

          <div className="mt-3 space-y-3">
            {facts.map((f, i) => (
              <FactCard key={i} fact={f} />
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有核验结果。生成方案后，点击「事实核验」让核查员找出方案里的外部事实并判断真伪。
        </div>
      )}
    </section>
  );
}

function FactCard({ fact }: { fact: FactData }) {
  const badge = STATUS_STYLES[fact.status] ?? "bg-paper-2 text-ink-soft";
  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className="flex items-start justify-between gap-3">
        <div className="text-sm font-medium text-ink">{fact.claim}</div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${badge}`}
        >
          {FACT_STATUS_LABELS[fact.status] ?? fact.status}
        </span>
      </div>

      {fact.source ? (
        <div className="mt-1.5 text-xs text-ink-soft">
          来源：{fact.source}
          {fact.sourceUrl ? `（${fact.sourceUrl}）` : ""}
        </div>
      ) : null}
      {fact.evidence ? (
        <div className="mt-1 text-xs text-ink-soft">证据：{fact.evidence}</div>
      ) : null}
      {fact.confidence ? (
        <div className="mt-1 text-xs text-ink-soft">置信度：{CONFIDENCE_LABELS[fact.confidence] ?? fact.confidence}</div>
      ) : null}
      {fact.reason ? (
        <div className="mt-1 text-xs text-ink-soft">理由：{fact.reason}</div>
      ) : null}
      {fact.requiresHumanVerification ? (
        <div className="mt-1.5 text-xs font-medium text-gold">
          ⚠️ 需要人工核验
        </div>
      ) : null}
    </div>
  );
}
