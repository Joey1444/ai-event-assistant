"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepHeading } from "@/components/projects/StepHeading";
import { factCheckProject, verifyFact } from "@/lib/agents/actions";
import { CONFIDENCE_LABELS, FACT_STATUS_LABELS, type FactData } from "@/lib/agents/types";

const STATUS_STYLES: Record<string, string> = {
  FACT: "bg-ok-soft text-ok",
  USER_PROVIDED: "bg-info-soft text-info",
  ASSUMPTION: "bg-gold-soft text-gold",
  UNKNOWN: "bg-paper-2 text-ink-soft",
  CONFLICT: "bg-cinnabar-soft text-cinnabar",
};

export function FactCheckPanel({
  projectId,
  savedFacts,
  id,
}: {
  projectId: string;
  savedFacts: FactData[];
  id?: string;
}) {
  const [facts, setFacts] = useState<FactData[]>(savedFacts);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleRun() {
    setError(null);
    startTransition(async () => {
      const r = await factCheckProject(projectId);
      if (r.ok) {
        setFacts(r.facts);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  async function handleVerify(
    factId: string,
    verification: "verified" | "rejected",
    note: string,
  ): Promise<{ ok: boolean; error?: string }> {
    const r = await verifyFact(projectId, factId, verification, note);
    if (r.ok) {
      setFacts((prev) =>
        prev.map((f) =>
          f.id === factId
            ? {
                ...f,
                verification,
                humanNote: note.trim() || undefined,
                ...(verification === "verified"
                  ? { status: "USER_PROVIDED" }
                  : {}),
              }
            : f,
        ),
      );
      // 刷新服务端数据，让顶部「下一步」的待核验计数实时更新
      router.refresh();
      return { ok: true };
    }
    return { ok: false, error: r.error };
  }

  const critical = facts.filter(
    (f) => f.requiresHumanVerification && !f.verification,
  );

  // 按严谨性从低到高排列：未知 → 冲突 → 假设 → 用户提供 → 已确认
  const STATUS_ORDER: Record<string, number> = {
    UNKNOWN: 0,
    CONFLICT: 1,
    ASSUMPTION: 2,
    USER_PROVIDED: 3,
    FACT: 4,
  };
  const sortedFacts = [...facts].sort(
    (a, b) =>
      (STATUS_ORDER[a.status] ?? 5) - (STATUS_ORDER[b.status] ?? 5),
  );

  // 按状态分组（sortedFacts 已按严谨度排序），用于列表分组标题
  const groupedFacts: { status: string; items: FactData[] }[] = [];
  for (const f of sortedFacts) {
    const last = groupedFacts[groupedFacts.length - 1];
    if (last && last.status === f.status) last.items.push(f);
    else groupedFacts.push({ status: f.status, items: [f] });
  }

  return (
    <section id={id} className="mt-8">
      <div className="flex items-center justify-between">
        <StepHeading id="factcheck" />
        <button
          type="button"
          onClick={handleRun}
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isPending ? "核验中…（约 20-60 秒）" : facts.length > 0 ? "重新核验" : "事实核验"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {facts.length > 0 ? (
        <>
          <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm">
            <span className="font-semibold text-cinnabar">
              {critical.length > 0
                ? `还有 ${critical.length} 条需要人工确认`
                : "无需人工确认"}
            </span>
            <span className="text-ink-soft">
              {critical.length > 0 ? "（下方列表里带边框高亮的条目）" : ""}
            </span>
          </div>

          <div className="mt-3 space-y-4">
            {groupedFacts.map((g, gi) => (
              <div key={gi}>
                <div className="mb-2 text-xs font-medium text-ink-soft">
                  {FACT_STATUS_LABELS[g.status] ?? g.status}（{g.items.length}）
                </div>
                <div className="space-y-3">
                  {g.items.map((f, i) => (
                    <FactCard key={i} fact={f} onVerify={handleVerify} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有核验结果。选择活动方向后，点击「事实核验」让核查员核验所选方案的外部事实。
        </div>
      )}
    </section>
  );
}

function FactCard({
  fact,
  onVerify,
}: {
  fact: FactData;
  onVerify: (
    factId: string,
    verification: "verified" | "rejected",
    note: string,
  ) => Promise<{ ok: boolean; error?: string }>;
}) {
  const badge = STATUS_STYLES[fact.status] ?? "bg-paper-2 text-ink-soft";
  const [note, setNote] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handle(verification: "verified" | "rejected") {
    if (!fact.id) return;
    setError(null);
    setPending(true);
    const r = await onVerify(fact.id, verification, note);
    if (!r.ok) setError(r.error ?? "核验失败，请重试");
    else setNote("");
    setPending(false);
  }

  const needsVerify = fact.requiresHumanVerification && !fact.verification;

  return (
    <div
      className={`rounded-lg border bg-card px-4 py-3 ${
        needsVerify ? "border-cinnabar" : "border-border"
      }`}
    >
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
        <div
          className="mt-1 text-xs text-ink-soft"
          title="小莫对自己判断的把握程度：高=很确定，中=基本确定，低=猜测，需要你核实"
        >
          置信度：{CONFIDENCE_LABELS[fact.confidence] ?? fact.confidence}
        </div>
      ) : null}
      {fact.reason ? (
        <div className="mt-1 text-xs text-ink-soft">理由：{fact.reason}</div>
      ) : null}

      {needsVerify ? (
        <div className="mt-2 rounded-lg bg-paper-2 px-3 py-2">
          <div className="text-xs font-medium text-cinnabar">⚠️ 需要人工核验</div>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="补充说明（可选）"
            className="mt-1.5 w-full rounded border border-border bg-card px-2 py-1 text-sm text-ink focus:border-gold focus:outline-none"
          />
          <div className="mt-2 flex gap-2">
            <button
              type="button"
              onClick={() => handle("verified")}
              disabled={pending}
              className="rounded-lg bg-ok px-3 py-1 text-xs font-medium text-paper hover:opacity-90 disabled:opacity-50"
            >
              确认
            </button>
            <button
              type="button"
              onClick={() => handle("rejected")}
              disabled={pending}
              className="rounded-lg border border-cinnabar px-3 py-1 text-xs font-medium text-cinnabar hover:bg-cinnabar-soft disabled:opacity-50"
            >
              驳回
            </button>
          </div>
          {error ? (
            <div className="mt-1 text-xs text-cinnabar">{error}</div>
          ) : null}
        </div>
      ) : fact.verification ? (
        <div
          className={`mt-1.5 text-xs font-medium ${
            fact.verification === "verified" ? "text-ok" : "text-cinnabar"
          }`}
        >
          {fact.verification === "verified" ? "✅ 已人工确认" : "❌ 已人工驳回"}
          {fact.humanNote ? (
            <span className="text-ink-soft"> · {fact.humanNote}</span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
