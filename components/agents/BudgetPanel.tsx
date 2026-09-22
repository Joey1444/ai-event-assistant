"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { StepHeading } from "@/components/projects/StepHeading";
import { generateBudget, saveBudgetVersion } from "@/lib/agents/actions";
import {
  BUDGET_CATEGORY_LABELS,
  BUDGET_SOURCE_LABELS,
  CONFIDENCE_LABELS,
  type BudgetData,
  type BudgetItemData,
} from "@/lib/agents/types";

const SOURCE_STYLES: Record<string, string> = {
  ASSUMPTION: "bg-gold-soft text-gold",
  USER_PROVIDED: "bg-green-100 text-green-800",
  SOURCE_BASED: "bg-blue-100 text-blue-700",
};

export function BudgetPanel({
  projectId,
  latestBudget,
  id,
}: {
  projectId: string;
  latestBudget: BudgetData | null;
  id?: string;
}) {
  const [budget, setBudget] = useState<BudgetData | null>(latestBudget);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<BudgetItemData[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  function copyBudget() {
    if (!budget) return;
    const cur = budget.currency ?? "KES";
    const lines = [`预算摘要：${budget.summary ?? ""}`];
    for (const i of budget.items) {
      lines.push(
        `${BUDGET_CATEGORY_LABELS[i.category] ?? i.category}｜${i.item} ×${i.quantity}${i.unit} @ ${i.unitPrice} = ${(i.quantity * i.unitPrice).toFixed(2)} ${cur}`,
      );
    }
    navigator.clipboard.writeText(lines.join("\n")).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const r = await generateBudget(projectId);
      if (r.ok) {
        setBudget(r.budget);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function startEdit() {
    setDraft((budget?.items ?? []).map((i) => ({ ...i })));
    setEditing(true);
  }

  function updateItem(
    index: number,
    field: "quantity" | "unitPrice",
    value: number,
  ) {
    setDraft((d) =>
      d.map((item, i) => (i === index ? { ...item, [field]: value } : item)),
    );
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await saveBudgetVersion(projectId, draft);
      if (r.ok) {
        setBudget(r.budget);
        setEditing(false);
      } else {
        setError(r.error);
      }
    });
  }

  const displayItems = editing ? draft : (budget?.items ?? []);
  const currency = budget?.currency ?? "KES";
  const total = displayItems.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const contingency = total * (budget?.contingencyRate ?? 0.1);
  const grandTotal = total + contingency;

  return (
    <section id={id} className="mt-8">
      <div className="flex items-center justify-between">
        <StepHeading id="budget" />
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
              {budget ? (
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
                    onClick={copyBudget}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
                  >
                    {copied ? "已复制" : "复制"}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
              >
                {isPending ? "生成中…（约 20-60 秒）" : budget ? "重新生成" : "生成预算"}
              </button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {budget ? (
        <div className="mt-3 space-y-3">
          <div className="text-xs text-ink-soft">
            版本 {budget.version} ·{" "}
            {budget.createdByAgent === "user" ? "用户编辑" : "小莫生成"} ·{" "}
            {formatDate(budget.createdAt)}
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-xs font-medium text-ink-soft">
              预算摘要
            </div>
            <p className="mt-1 whitespace-pre-wrap text-sm text-ink">
              {budget.summary || "—"}
            </p>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <SummaryStat label="总计" value={money(total, currency)} />
              <SummaryStat
                label={`应急金 (${Math.round((budget.contingencyRate ?? 0.1) * 100)}%)`}
                value={money(contingency, currency)}
              />
              <SummaryStat
                label="总计（含应急）"
                value={money(grandTotal, currency)}
                highlight
              />
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border border-border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-paper-2 text-left text-xs text-ink-soft">
                <tr>
                  <th className="px-3 py-2">分类</th>
                  <th className="px-3 py-2">项目</th>
                  <th className="px-3 py-2 text-right">数量</th>
                  <th className="px-3 py-2 text-right">单价</th>
                  <th className="px-3 py-2 text-right">小计</th>
                  <th className="px-3 py-2">来源</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {displayItems.map((item, idx) => (
                  <tr key={idx} className="align-top">
                    <td className="px-3 py-2 text-xs text-ink-soft">
                      {BUDGET_CATEGORY_LABELS[item.category] ?? item.category}
                    </td>
                    <td className="px-3 py-2">
                      <div>{item.item}</div>
                      {item.confidence ? (
                        <div
                          className="mt-0.5 text-xs text-ink-soft"
                          title="小莫对自己判断的把握程度：高=很确定，中=基本确定，低=猜测，需要你核实"
                        >
                          置信度：{CONFIDENCE_LABELS[item.confidence] ?? item.confidence}
                        </div>
                      ) : null}
                      {item.notes ? (
                        <div className="mt-0.5 text-xs text-ink-soft">
                          {item.notes}
                        </div>
                      ) : null}
                    </td>
                    <td className="whitespace-nowrap px-3 py-2 text-right">
                      {editing ? (
                        <span className="inline-flex items-center gap-1">
                          <input
                            type="number"
                            step="any"
                            value={item.quantity}
                            onChange={(e) =>
                              updateItem(idx, "quantity", Number(e.target.value))
                            }
                            className="w-16 rounded border border-border px-1.5 py-1 text-right text-sm"
                          />
                          <span className="text-xs text-ink-soft">
                            {item.unit}
                          </span>
                        </span>
                      ) : (
                        <>
                          {item.quantity} {item.unit}
                        </>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right">
                      {editing ? (
                        <input
                          type="number"
                          step="any"
                          value={item.unitPrice}
                          onChange={(e) =>
                            updateItem(idx, "unitPrice", Number(e.target.value))
                          }
                          className="w-24 rounded border border-border px-1.5 py-1 text-right text-sm"
                        />
                      ) : (
                        money(item.unitPrice, currency)
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-medium">
                      {money(item.quantity * item.unitPrice, currency)}
                    </td>
                    <td className="px-3 py-2">
                      <span
                        className={`inline-block whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium ${SOURCE_STYLES[item.source] ?? "bg-paper-2 text-ink-soft"}`}
                      >
                        {BUDGET_SOURCE_LABELS[item.source] ?? item.source}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="rounded-lg border border-border bg-card px-4 py-3">
            <div className="text-xs font-medium text-ink-soft">成本风险</div>
            {budget.costRisks.length > 0 ? (
              <ul className="mt-1 list-disc pl-5 text-sm text-ink">
                {budget.costRisks.map((r, i) => (
                  <li key={i} className="mt-0.5">
                    {r}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-1 text-sm text-ink-soft">（无）</p>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有预算。生成详细活动方案后，点击「生成预算」。
        </div>
      )}
    </section>
  );
}

function SummaryStat({
  label,
  value,
  highlight,
}: {
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div className="rounded-lg border border-border bg-paper-2 px-2 py-2">
      <div className="text-xs text-ink-soft">{label}</div>
      <div
        className={`mt-0.5 text-sm font-semibold ${highlight ? "text-gold" : "text-ink"}`}
      >
        {value}
      </div>
    </div>
  );
}

function money(n: number, currency: string): string {
  return `${n.toFixed(2)} ${currency}`;
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
