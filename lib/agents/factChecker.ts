// Fact Checker Agent：从活动方案中找出所有外部事实，并判断 FACT/ASSUMPTION/UNKNOWN/CONFLICT
import { generateText } from "@/lib/ai/provider";
import type { FactData } from "./types";

const FACT_CHECKER_PROMPT = `# 角色
你是一名严谨的事实核查员（Fact Checker）。你的职责是：找出三个活动方案中所有「外部事实」，并逐一判断其真实性状态。

# 输入
项目简报（背景）、三个活动方案（Concept A/B/C，主要检查对象）、事实账本（Fact Ledger，已核实的来源）、研究资料库（Research Library，来源）。

# 「外部事实」指
关于现实世界的具体信息：场地名称与容量、日期时间、预算金额与币种、人员数量、联系人、学校/机构规定、供应商、设备租赁、食品许可、安全要求等。

# 每条事实判断 status（四选一）
- FACT：有来源（事实账本/研究资料）明确支持、可确认为真。
- ASSUMPTION：方案里作为假设提出、没有确凿来源。
- UNKNOWN：无法确认、也没有来源。
- CONFLICT：两个或多个来源互相矛盾。

# 分类示例（严格照此判断）
- 方案写「活动地点为莫伊大学主校区礼堂」，但事实账本里没有这条 → status=UNKNOWN（绝不因"听起来合理"就判 FACT）。
- 方案写「地点……[ASSUMPTION]」→ status=ASSUMPTION。
- 事实账本有「礼堂可容纳200人，来源：校方」→ status=FACT，source 填「校方」。
- 事实账本A说「日期9月15日」、B说「日期9月22日」→ status=CONFLICT，reason 里写明双方。

# 每条记录字段
{"claim":"事实描述","evidence":"证据（来自哪条资料/原文）","source":"来源名称（没有就空字符串）","sourceUrl":"来源链接（没有就空字符串）","confidence":"high|medium|low","status":"FACT|ASSUMPTION|UNKNOWN|CONFLICT","reason":"为什么这样判","requiresHumanVerification":true}

# 硬性规则
1. 绝不根据常识把事实判为 FACT。没有来源就是 UNKNOWN，绝不是 FACT。
2. 只有事实账本或研究资料库能明确支持的说法，才可判 FACT，并写出 source / evidence。
3. 方案中标注了 [ASSUMPTION] 的内容，一律判 ASSUMPTION。
4. 若不同来源说法矛盾，判 CONFLICT，并在 reason 里明确写出冲突双方各自说了什么。
5. confidence 用 high / medium / low。
6. requiresHumanVerification：status 为 UNKNOWN 或 CONFLICT 的关键事实（场地/日期/预算/人数/联系人/审批/安全合规）设为 true；FACT 设为 false；ASSUMPTION 通常设为 true（需人工确认是否接受该假设）。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要解释文字）
{"facts":[{"claim":"...","evidence":"...","source":"...","sourceUrl":"...","confidence":"...","status":"...","reason":"...","requiresHumanVerification":true}]}`;

export async function runFactChecker(input: {
  briefText: string;
  conceptsText: string;
  researchText: string;
  factsText: string;
}): Promise<FactData[]> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${FACT_CHECKER_PROMPT}\n\n项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n三个方案：\n${input.conceptsText}\n\n请找出外部事实并输出 JSON。`,
      },
    ],
    maxTokens: 16000,
    timeoutMs: 300000,
  });
  return parseFacts(text);
}

function parseFacts(text: string): FactData[] {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容无法解析为 JSON");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;

  const arr = Array.isArray(parsed) ? parsed : parsed.facts;
  if (!Array.isArray(arr)) {
    throw new Error("无法解析事实数组");
  }

  return arr.map((x) => {
    const o = (x ?? {}) as Record<string, unknown>;
    const status = String(o.status ?? "UNKNOWN").toUpperCase();
    return {
      claim: String(o.claim ?? ""),
      evidence: String(o.evidence ?? ""),
      source: String(o.source ?? ""),
      sourceUrl: String(o.sourceUrl ?? ""),
      confidence: String(o.confidence ?? ""),
      status: ["FACT", "ASSUMPTION", "UNKNOWN", "CONFLICT"].includes(status)
        ? status
        : "UNKNOWN",
      reason: String(o.reason ?? ""),
      requiresHumanVerification: Boolean(o.requiresHumanVerification),
    };
  });
}
