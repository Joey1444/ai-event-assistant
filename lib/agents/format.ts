// 格式化助手：把 Prisma 查询结果格式化成给 Agent 用的文本。
import type { ConceptData } from "./types";

export type BriefFields = {
  eventType: string | null;
  objective: string | null;
  eventDate: string | null;
  expectedParticipants: string | null;
  budget: string | null;
  location: string | null;
  targetAudience: string | null;
  requirements: string | null;
  notes: string | null;
};

export function formatBrief(p: {
  projectName: string;
  organization: string;
  brief: BriefFields | null;
}): string {
  const b = p.brief;
  return [
    `项目名称：${p.projectName}`,
    `主办机构：${p.organization}`,
    `活动类型：${b?.eventType || "（未填写）"}`,
    `活动目的：${b?.objective || "（未填写）"}`,
    `活动日期：${b?.eventDate || "（未填写）"}`,
    `预计人数：${b?.expectedParticipants || "（未填写）"}`,
    `预算：${b?.budget || "（未填写）"}`,
    `活动地点：${b?.location || "（未填写）"}`,
    `目标人群：${b?.targetAudience || "（未填写）"}`,
    `已知要求：${b?.requirements || "（未填写）"}`,
    `其他备注：${b?.notes || "（未填写）"}`,
  ].join("\n");
}

export function formatResearch(
  items: { title: string; content: string; source: string | null }[],
): string {
  if (items.length === 0) return "（暂无研究资料）";
  return items
    .map(
      (r, i) =>
        `${i + 1}. ${r.title}\n   ${r.content}${r.source ? `\n   来源：${r.source}` : ""}`,
    )
    .join("\n");
}

export function formatFacts(
  facts: { claim: string; source: string | null; status: string }[],
): string {
  if (facts.length === 0) return "（暂无已验证事实）";
  return facts
    .map(
      (f, i) =>
        `${i + 1}. ${f.claim} [状态:${f.status}${f.source ? ` | 来源:${f.source}` : ""}]`,
    )
    .join("\n");
}

export function formatConceptsText(
  concepts: { variant: string; direction: string; content: string }[],
): string {
  return concepts.map(formatConceptText).join("\n\n");
}

export function formatConceptText(c: {
  variant: string;
  direction: string;
  content: string;
}): string {
  const d = JSON.parse(c.content) as ConceptData;
  const lines = Object.entries(d)
    .filter(([k]) => k !== "variant" && k !== "direction")
    .map(([k, v]) => `${k}：${v}`);
  return `【Concept ${c.variant} · ${c.direction}】\n${lines.join("\n")}`;
}

export function formatPlanText(plan: { content: string }): string {
  const d = JSON.parse(plan.content) as Record<string, string>;
  return Object.entries(d)
    .map(([k, v]) => `${k}：\n${v}`)
    .join("\n\n");
}

export function formatBudgetForQa(b: {
  summary: string | null;
  currency: string;
  total: number | null;
  contingencyRate: number;
  items: {
    category: string;
    item: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    source: string;
  }[];
}): string {
  const lines = [`预算摘要：${b.summary ?? ""}`, `币种：${b.currency}`];
  const total =
    b.total ?? b.items.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  lines.push(`合计：${total} ${b.currency}（应急金 ${Math.round((b.contingencyRate ?? 0.1) * 100)}%）`);
  for (const i of b.items) {
    lines.push(
      `${i.category} ${i.item} x${i.quantity}${i.unit} @${i.unitPrice}${b.currency} (${i.source})`,
    );
  }
  return lines.join("\n");
}

export function formatContentForQa(content: string): string {
  try {
    const d = JSON.parse(content) as Record<string, string>;
    return Object.entries(d)
      .map(([k, v]) => `${k}：${v}`)
      .join("\n");
  } catch {
    return content;
  }
}
