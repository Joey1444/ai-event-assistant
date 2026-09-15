"use client";

import { useState, useTransition } from "react";
import { runFinalQa } from "@/lib/agents/actions";
import { RESULT_LABELS, type FinalQaRecord } from "@/lib/agents/types";

const RESULT_STYLES: Record<string, string> = {
  PASS: "bg-green-100 text-green-800",
  WARNING: "bg-gold-soft text-gold",
  BLOCK: "bg-cinnabar-soft text-cinnabar",
};

const STATUS_STYLES: Record<string, string> = {
  pass: "bg-green-100 text-green-800",
  warning: "bg-gold-soft text-gold",
  block: "bg-cinnabar-soft text-cinnabar",
};

export function FinalQaPanel({
  projectId,
  savedQa,
}: {
  projectId: string;
  savedQa: FinalQaRecord | null;
}) {
  const [qa, setQa] = useState<FinalQaRecord | null>(savedQa);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const r = await runFinalQa(projectId);
      if (r.ok) setQa(r.qa);
      else setError(r.error);
    });
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">发布前检查</h2>
        <button
          type="button"
          onClick={handleRun}
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isPending ? "检查中…" : qa ? "重新检查" : "运行发布前检查"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {qa ? (
        <div className="mt-3 space-y-3">
          <div className="flex items-center gap-3">
            <span
              className={`rounded-full px-3 py-1 text-sm font-bold ${RESULT_STYLES[qa.result] ?? "bg-paper-2 text-ink-soft"}`}
            >
              {RESULT_LABELS[qa.result] ?? qa.result}
            </span>
            <span className="text-xs text-ink-soft">版本 {qa.version}</span>
          </div>
          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-xs font-medium text-ink-soft">检查结论</div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
              {qa.summary || "—"}
            </p>
          </div>
          <div className="space-y-2">
            {qa.findings.map((f, i) => (
              <div
                key={i}
                className="flex items-start gap-3 rounded-lg border border-border bg-card px-4 py-2.5"
              >
                <span
                  className={`mt-0.5 shrink-0 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[f.status] ?? "bg-paper-2 text-ink-soft"}`}
                >
                  {f.status === "pass" ? "通过" : f.status === "warning" ? "警告" : "阻断"}
                </span>
                <div className="min-w-0">
                  <div className="text-sm font-medium text-ink">
                    {f.check}
                  </div>
                  <div className="mt-0.5 text-xs text-ink-soft">{f.detail}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有检查结果。点击「运行发布前检查」对项目做发布前检查。
        </div>
      )}

      <p className="mt-3 text-xs font-medium text-ink-soft">
        这是 AI 质量检查，不代表最终批准。
      </p>
    </section>
  );
}
