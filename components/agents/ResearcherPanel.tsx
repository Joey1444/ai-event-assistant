"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { StepHeading } from "@/components/projects/StepHeading";
import { researchProject } from "@/lib/agents/actions";
import { FACT_STATUS_LABELS, type FactData } from "@/lib/agents/types";

const STATUS_STYLES: Record<string, string> = {
  FACT: "bg-ok-soft text-ok",
  USER_PROVIDED: "bg-info-soft text-info",
  ASSUMPTION: "bg-gold-soft text-gold",
  UNKNOWN: "bg-paper-2 text-ink-soft",
  CONFLICT: "bg-cinnabar-soft text-cinnabar",
};

type Item = {
  title: string;
  content: string;
  source: string;
  sourceUrl: string;
};

export function ResearcherPanel({
  projectId,
  savedItems,
  savedFacts,
  id,
}: {
  projectId: string;
  savedItems: Item[];
  savedFacts: FactData[];
  id?: string;
}) {
  const [items, setItems] = useState<Item[]>(savedItems);
  const [facts, setFacts] = useState<FactData[]>(savedFacts);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  async function handleRun() {
    setError(null);
    setIsLoading(true);
    try {
      const r = await researchProject(projectId);
      if (r.ok) {
        setItems(r.items);
        setFacts(r.facts);
        router.refresh();
      } else {
        setError(r.error);
      }
    } catch {
      setError("调研失败，请重试");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <section id={id} className="mt-8">
      <div className="flex items-center justify-between">
        <StepHeading id="research" />
        <button
          type="button"
          onClick={handleRun}
          disabled={isLoading}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isLoading ? "调研中…（约 30-60 秒）" : items.length > 0 || facts.length > 0 ? "重新调研" : "开始联网调研"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {items.length > 0 || facts.length > 0 ? (
        <div className="mt-3 space-y-3">
          <div className="text-xs text-ink-soft">
            共 {items.length} 条资料 · {facts.length} 条事实
          </div>

          {facts.length > 0 ? (
            <div className="rounded-lg border border-border bg-card px-4 py-3">
              <div className="text-xs font-medium text-ink-soft">事实（供方案与核验使用）</div>
              <ul className="mt-2 space-y-1.5 text-sm text-ink">
                {facts.map((f, i) => (
                  <li key={i}>
                    <span
                      className={`mr-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_STYLES[f.status] ?? "bg-paper-2 text-ink-soft"}`}
                    >
                      {FACT_STATUS_LABELS[f.status] ?? f.status}
                    </span>
                    {f.claim}
                    {f.source ? (
                      <span className="text-xs text-ink-soft">（{f.source}）</span>
                    ) : null}
                  </li>
                ))}
              </ul>
            </div>
          ) : null}

          {items.length > 0 ? (
            <div className="space-y-2">
              {items.map((it, i) => (
                <div key={i} className="rounded-lg border border-border bg-card px-4 py-3">
                  <div className="text-sm font-medium text-ink">{it.title || it.source || "资料"}</div>
                  <div className="mt-1 whitespace-pre-wrap text-xs text-ink-soft">{it.content}</div>
                  {it.sourceUrl ? (
                    <a
                      href={it.sourceUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-1 block text-xs text-gold hover:underline"
                    >
                      查看来源 ↗
                    </a>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有调研结果。点击「开始联网调研」，让研究员联网查找场地、价格、规定等资料，填充研究库和事实账本。
        </div>
      )}
    </section>
  );
}
