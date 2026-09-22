"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepHeading } from "@/components/projects/StepHeading";
import { analyzeProject } from "@/lib/agents/actions";
import type { PmAnalysisData } from "@/lib/agents/types";

export function PmAnalysisPanel({
  projectId,
  savedAnalysis,
  id,
}: {
  projectId: string;
  savedAnalysis: PmAnalysisData | null;
  id?: string;
}) {
  const [analysis, setAnalysis] = useState<PmAnalysisData | null>(savedAnalysis);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const r = await analyzeProject(projectId);
      if (r.ok) {
        setAnalysis(r.analysis);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section id={id} className="mt-8">
      <div className="flex items-center justify-between">
        <StepHeading id="pm" />
        <button
          type="button"
          onClick={handleRun}
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isPending ? "分析中…（约 20-60 秒）" : analysis ? "重新分析" : "运行分析"}
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

      {analysis.blockers.length > 0 ? (
        <div className="rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3">
          <div className="text-xs font-semibold text-cinnabar">
            需要先解决的关键问题（{analysis.blockers.length}）
          </div>
          <ul className="mt-2 space-y-2 text-sm text-ink">
            {analysis.blockers.map((b, i) => (
              <li key={i}>
                <div className="font-medium">{b.item}</div>
                {b.why ? (
                  <div className="mt-0.5 text-xs text-ink-soft">{b.why}</div>
                ) : null}
                {b.blockingQuestion ? (
                  <div className="mt-0.5 text-xs text-cinnabar">
                    → {b.blockingQuestion}
                  </div>
                ) : null}
              </li>
            ))}
          </ul>
        </div>
      ) : null}

      <ListSection title="其它提醒（次要）" items={analysis.minorGaps} tone="muted" />
      <ListSection
        title="小莫的猜测（未经确认）"
        items={analysis.assumptions}
        tone="muted"
        hint="小莫在信息不全时的推测，不是事实，你确认后再往下走"
      />

      <div className="rounded-lg border border-border bg-card px-4 py-3">
        <div className="text-xs font-medium text-ink-soft">下一步</div>
        <p className="mt-1 text-sm text-ink">{analysis.nextStep || "—"}</p>
        {!analysis.canStart ? (
          <div className="mt-2 text-xs font-medium text-gold">
            ⚠️ 信息还不完整，补充后才能继续
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
  hint,
}: {
  title: string;
  items: string[];
  tone?: "default" | "amber" | "muted";
  hint?: string;
}) {
  const titleColor =
    tone === "amber"
      ? "text-gold"
      : tone === "muted"
        ? "text-ink-soft"
        : "text-ink-soft";

  return (
    <div className="rounded-lg border border-border bg-card px-4 py-3" title={hint}>
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
