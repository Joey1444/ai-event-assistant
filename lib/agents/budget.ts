// Budget Agent：根据活动方案生成预算
import { generateText } from "@/lib/ai/provider";
import type { BudgetItemData } from "./types";

const BUDGET_PROMPT = `# 角色
你是一名严谨的预算规划师（Budget Agent）。你的职责是：根据活动方案，生成一份分类清晰、可复核的预算，并明确标注每笔价格的来源与可信度。你绝不假装知道当地实际价格。

# 输入
活动方案、项目简报、研究资料库、事实账本。

# 每项预算字段
- category：分类（只用这 10 个：Venue、Decoration、Food、Printing、Equipment、Transportation、Gifts、Staff、Marketing、Miscellaneous）
- item：项目名称
- quantity：数量（数字）
- unit：单位（如 个/份/套/人/次/场）
- unitPrice：单价（纯数字，不含货币符号，如 500 而不是 "500元"）
- notes：备注
- source：价格来源（ASSUMPTION / USER_PROVIDED / SOURCE_BASED）
- confidence：置信度（high / medium / low）

# 价格来源 source（严格分类）
- ASSUMPTION：你估算/猜测的价格 → confidence 标 low。
- USER_PROVIDED：项目简报里用户明确提供的价格。
- SOURCE_BASED：来自研究资料库或事实账本的价格。
- 事实账本/研究资料里没有的价格，一律不得标 SOURCE_BASED，只能标 ASSUMPTION。

# 额外输出
- summary：预算摘要（一段话，说明总预算、应急金比例、主要支出方向、以及价格不确定的部分）。
- costRisks：成本风险（字符串数组，如：单价为估算、币种未确认、某类支出可能超支等）。
- currency：币种代码（默认 KES 肯尼亚先令；若简报明确其它币种则用该币种）。
- total：全部 item 的 quantity×unitPrice 之和（纯数字）。
- contingencyRate：应急金比例（0 到 1 之间的小数，默认 0.1）。

# 硬性规则
1. 让各项 quantity×unitPrice 之和尽量贴合项目简报的总预算（如果简报给了）。
2. 默认不要假装知道当地实际价格；凡是估算的价格一律 ASSUMPTION + confidence=low。
3. quantity 和 unitPrice 必须是数字，不要带货币符号或单位。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要解释文字）
{"items":[{"category":"Venue","item":"...","quantity":1,"unit":"场","unitPrice":0,"notes":"...","source":"ASSUMPTION","confidence":"low"}],"summary":"...","costRisks":["..."],"currency":"KES","total":0,"contingencyRate":0.1}`;

export type BudgetResult = {
  items: BudgetItemData[];
  summary: string;
  costRisks: string[];
  currency: string;
  total: number;
  contingencyRate: number;
};

export async function runBudget(input: {
  planText: string;
  briefText: string;
  researchText: string;
  factsText: string;
}): Promise<BudgetResult> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${BUDGET_PROMPT}\n\n项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n活动方案：\n${input.planText}\n\n请生成预算并输出 JSON。`,
      },
    ],
    maxTokens: 50000,
    timeoutMs: 300000,
  });
  return parseBudget(text);
}

function parseBudget(text: string): BudgetResult {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容无法解析为 JSON");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;

  const items = Array.isArray(parsed.items) ? parsed.items : [];
  const mapped = items.map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    const source = String(o.source ?? "ASSUMPTION").toUpperCase();
    return {
      category: String(o.category ?? "Miscellaneous"),
      item: String(o.item ?? ""),
      quantity: toNumber(o.quantity),
      unit: String(o.unit ?? ""),
      unitPrice: toNumber(o.unitPrice),
      notes: String(o.notes ?? ""),
      source: ["ASSUMPTION", "USER_PROVIDED", "SOURCE_BASED"].includes(source)
        ? source
        : "ASSUMPTION",
      confidence: String(o.confidence ?? ""),
    };
  });
  const total =
    toNumber(parsed.total) ||
    mapped.reduce((s, i) => s + i.quantity * i.unitPrice, 0);
  const contingency = Number(parsed.contingencyRate);
  return {
    items: mapped,
    summary: String(parsed.summary ?? ""),
    costRisks: toStrArray(parsed.costRisks),
    currency: String(parsed.currency ?? "KES") || "KES",
    total,
    contingencyRate: Number.isFinite(contingency) ? contingency : 0.1,
  };
}

function toNumber(v: unknown): number {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}

function toStrArray(v: unknown): string[] {
  if (!Array.isArray(v)) return [];
  return v.map((x) => String(x)).filter((s) => s.trim() !== "");
}
