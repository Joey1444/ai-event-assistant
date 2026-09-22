"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepHeading } from "@/components/projects/StepHeading";
import { generatePlan, savePlanVersion } from "@/lib/agents/actions";
import {
  PLAN_SECTION_LABELS,
  PLAN_SECTIONS,
  type ActivityPlanData,
  type PlanData,
} from "@/lib/agents/types";

export function DetailedPlanPanel({
  projectId,
  decisionCompleted,
  selectedVariant,
  latestPlan,
  id,
}: {
  projectId: string;
  decisionCompleted: boolean;
  selectedVariant: string | null;
  latestPlan: ActivityPlanData | null;
  id?: string;
}) {
  const [plan, setPlan] = useState<ActivityPlanData | null>(latestPlan);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<PlanData>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [copied, setCopied] = useState(false);
  const [showAll, setShowAll] = useState(false);

  function copyAll() {
    if (!plan) return;
    const text = PLAN_SECTIONS.map(
      (k) => `${PLAN_SECTION_LABELS[k]}\n${plan.content[k] ?? ""}`,
    ).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const r = await generatePlan(projectId);
      if (r.ok) {
        setPlan(r.plan);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function startEdit() {
    setDraft(plan?.content ?? {});
    setEditing(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await savePlanVersion(projectId, draft);
      if (r.ok) {
        setPlan(r.plan);
        setEditing(false);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section id={id} className="mt-8">
      <div className="flex items-center justify-between">
        <StepHeading id="plan" />
        {decisionCompleted ? (
          <div className="flex gap-2">
            {editing ? (
              <>
                <button
                  type="button"
                  onClick={handleSave}
                  disabled={isPending}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
                >
                  {isPending ? "保存中…" : "保存版本"}
                </button>
                <button
                  type="button"
                  onClick={() => setEditing(false)}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
                >
                  取消
                </button>
              </>
            ) : (
              <>
                {plan ? (
                  <>
                    <button
                      type="button"
                      onClick={startEdit}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
                    >
                      编辑
                    </button>
                    <button
                      type="button"
                      onClick={copyAll}
                      className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
                    >
                      {copied ? "已复制" : "复制全部"}
                    </button>
                  </>
                ) : null}
                <button
                  type="button"
                  onClick={handleGenerate}
                  disabled={isPending}
                  className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
                >
                  {isPending ? "生成中…（约 20-60 秒）" : plan ? "重新生成" : "生成正式方案"}
                </button>
              </>
            )}
          </div>
        ) : null}
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {!decisionCompleted ? (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          请先在「选择方向」选择方案 A/B/C，然后才能生成详细方案。
        </div>
      ) : editing ? (
        <div className="mt-3 space-y-4">
          {PLAN_SECTIONS.map((key) => (
            <div key={key}>
              <label className="block text-sm font-medium text-ink">
                {PLAN_SECTION_LABELS[key]}
              </label>
              <textarea
                value={draft[key] ?? ""}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, [key]: e.target.value }))
                }
                rows={4}
                className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
              />
            </div>
          ))}
        </div>
      ) : plan ? (
        <div className="mt-3 space-y-3">
          <div className="text-xs text-ink-soft">
            版本 {plan.version} ·{" "}
            {plan.createdByAgent === "user" ? "用户编辑" : "小莫生成"} ·{" "}
            {formatDate(plan.createdAt)}
          </div>
          {(showAll ? PLAN_SECTIONS : PLAN_SECTIONS.slice(0, 4)).map((key) => (
            <div
              key={key}
              className="rounded-lg border border-border bg-card px-4 py-3"
            >
              <div className="text-xs font-medium text-ink-soft">
                {PLAN_SECTION_LABELS[key]}
              </div>
              <div className="mt-1 whitespace-pre-wrap text-sm text-ink">
                {plan.content[key] || "—"}
              </div>
            </div>
          ))}
          {PLAN_SECTIONS.length > 4 ? (
            <button
              type="button"
              onClick={() => setShowAll((v) => !v)}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
            >
              {showAll ? "收起" : `查看全部（共 ${PLAN_SECTIONS.length} 章节）`}
            </button>
          ) : null}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          已选择方案 {selectedVariant}。点击「生成正式方案」生成详细活动方案。
        </div>
      )}
    </section>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
