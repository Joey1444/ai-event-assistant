"use client";

import { useState, useTransition } from "react";
import { analyzeProject } from "@/lib/agents/actions";
import type { PmAnalysisData } from "@/lib/agents/types";

export function PmAnalysisPanel({
  projectId,
  savedAnalysis,
}: {
  projectId: string;
  savedAnalysis: PmAnalysisData | null;
}) {
  const [analysis, setAnalysis] = useState<PmAnalysisData | null>(savedAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const r = await analyzeProject(projectId);
      if (r.ok) {
        setAnalysis(r.analysis);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">项目经理分析</h2>
        <button
          type="button"
          onClick={handleRun}
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isPending ? "分析中…" : analysis ? "重新分析" : "运行分析"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {analysis ? (
        <AnalysisView analysis={analysis} />
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有分析结果。点击「运行分析」，让项目经理读取项目简报并给出判断。
        </div>
      )}
    </section>
  );
}

function AnalysisView({ analysis }: { analysis: PmAnalysisData }) {
  return (
    <div className="mt-3 space-y-3">
      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-xs font-medium text-ink-soft">摘要</div>
        <p className="mt-1 text-sm text-ink">{analysis.summary || "—"}</p>
      </div>

      <ListSection title="已知信息" items={analysis.knownFacts} />
      <ListSection title="未知信息" items={analysis.missingInformation} tone="amber" />
      <ListSection title="假设" items={analysis.assumptions} tone="muted" />

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-xs font-medium text-ink-soft">下一步</div>
        <p className="mt-1 text-sm text-ink">{analysis.nextStep || "—"}</p>
        {analysis.requiresHumanInput ? (
          <div className="mt-2 text-xs font-medium text-gold">
            ⚠️ 需要你补充信息后才能继续
          </div>
        ) : null}
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
  tone?: "default" | "amber" | "muted";
}) {
  const titleColor =
    tone === "amber"
      ? "text-gold"
      : tone === "muted"
        ? "text-ink-soft"
        : "text-ink-soft";

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
