"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepHeading } from "@/components/projects/StepHeading";
import { runCritique } from "@/lib/agents/actions";
import {
  CRITIQUE_SCORE_LABELS,
  CRITIQUE_SCORE_ORDER,
  type CritiqueData,
  type CritiqueScores,
} from "@/lib/agents/types";

export function CriticPanel({
  projectId,
  savedCritique,
  id,
}: {
  projectId: string;
  savedCritique: CritiqueData | null;
  id?: string;
}) {
  const [critique, setCritique] = useState<CritiqueData | null>(savedCritique);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const r = await runCritique(projectId);
      if (r.ok) {
        setCritique(r.critique);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section id={id} className="mt-8">
      <div className="flex items-center justify-between">
        <StepHeading id="critic" />
        <button
          type="button"
          onClick={handleRun}
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isPending ? "评审中…（约 20-60 秒）" : critique ? "重新评审" : "小莫评审"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {critique ? (
        <CritiqueView critique={critique} />
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有评审结果。生成方案后，点击「小莫评审」让评审专家给三个方案打分并找问题。
        </div>
      )}
    </section>
  );
}

function CritiqueView({ critique }: { critique: CritiqueData }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {CRITIQUE_SCORE_ORDER.map((key) => {
            const item = critique.scores[key as keyof CritiqueScores];
            return (
              <div key={key}>
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-ink-soft">
                    {CRITIQUE_SCORE_LABELS[key]}
                  </span>
                  <span className={scoreColor(item.score)}>{item.score}/10</span>
                </div>
                <p className="mt-0.5 text-xs text-ink-soft">{item.reason}</p>
              </div>
            );
          })}
        </div>
      </div>

      <ListSection title="优点" items={critique.strengths} tone="green" />
      <ListSection title="缺点" items={critique.weaknesses} tone="muted" />
      <ListSection title="潜在风险" items={critique.risks} tone="amber" />
      <ListSection title="严重问题" items={critique.criticalIssues} tone="red" />

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-xs font-medium text-ink-soft">评审总结</div>
        <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
          {critique.recommendation || "—"}
        </p>
      </div>

      <div className="rounded-lg border border-ink bg-paper-2 px-4 py-3">
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium text-ink">推荐方案</span>
          <span className="rounded-full bg-ink px-2.5 py-0.5 text-xs font-medium text-paper">
            方案 {critique.recommendedConcept || "—"}
          </span>
        </div>
        <p className="mt-2 text-xs font-medium text-ink-soft">
          小莫推荐，不代表最终决定。
        </p>
      </div>
    </div>
  );
}

function ListSection({
  title,
  items,
  tone = "default",
}: {
  title: string;
  items: string[];
  tone?: "default" | "green" | "amber" | "muted" | "red";
}) {
  const titleColor = {
    green: "text-ok",
    amber: "text-gold",
    muted: "text-ink-soft",
    red: "text-cinnabar",
    default: "text-ink-soft",
  }[tone];

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3">
      <div className={`text-xs font-medium ${titleColor}`}>
        {title}（{items.length}）
      </div>
      {items.length > 0 ? (
        <ul className="mt-1 list-disc pl-5 text-sm text-ink">
          {items.map((item, i) => (
            <li key={i} className="mt-0.5">
              {item}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-1 text-sm text-ink-soft">（无）</p>
      )}
    </div>
  );
}

function scoreColor(score: number): string {
  if (score >= 8) return "font-semibold text-ok";
  if (score >= 5) return "font-semibold text-gold";
  return "font-semibold text-cinnabar";
}
