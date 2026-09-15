// Final QA Agent：项目发布前最后一道 AI 检查
import { generateText } from "@/lib/ai/provider";
import type { QaFinding } from "./types";

const QA_PROMPT = `# 角色
你是一名严谨的 QA 审核员（Final QA Agent）。这是活动项目发布前的最后一道 AI 检查。你的职责是：读完整项目，逐项核对，找出会阻碍发布的问题，并给出 PASS / WARNING / BLOCK 结论。你不是最终批准者。

# 输入
项目简报、研究资料、事实账本、已选方案、详细活动方案、预算、宣传文案、海报内容。

# 检查 10 个方面
1. 信息是否一致（各模块间信息是否互相矛盾）
2. 日期是否一致
3. 地点是否一致
4. 人数是否一致
5. 预算是否一致
6. 活动流程是否自相矛盾
7. 海报信息是否缺失
8. 是否存在 UNKNOWN 事实（事实账本 status=UNKNOWN，尤其是关键事实）
9. 是否有冲突事实（事实账本 status=CONFLICT）
10. 是否存在明显执行风险

# 结论判定（result）
- BLOCK：发现明显冲突（两模块地点/日期/预算互相矛盾）、或预算严重不一致（方案预算与预算表总额差异巨大）。有任一 BLOCK 级问题，result 就应为 BLOCK。
- WARNING：发现关键事实（日期/地点/预算/联系人/人数）未确认、或普通文案问题（错别字/措辞不当），但没有 BLOCK 级问题。
- PASS：10 项全部无问题。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要解释文字）
{"result":"PASS|WARNING|BLOCK","summary":"一段话总结主要问题","findings":[{"check":"日期一致性","status":"pass|warning|block","detail":"..."}]}

findings 数组覆盖上述 10 个检查项（每项一条），status 用 pass/warning/block 之一；非 pass 的项必须写清具体问题（点名是哪个模块、差在哪）。`;

export async function runQa(input: {
  briefText: string;
  researchText: string;
  factsText: string;
  conceptText: string;
  planText: string;
  budgetText: string;
  copyText: string;
  posterText: string;
}): Promise<{ result: string; summary: string; findings: QaFinding[] }> {
  const content = [
    `项目简报：\n${input.briefText}`,
    `研究资料库：\n${input.researchText}`,
    `事实账本：\n${input.factsText}`,
    `已选方案：\n${input.conceptText}`,
    `详细活动方案：\n${input.planText}`,
    `预算：\n${input.budgetText}`,
    `宣传文案：\n${input.copyText}`,
    `海报内容：\n${input.posterText}`,
  ].join("\n\n");

  const text = await generateText({
    messages: [
      { role: "user", content: `${QA_PROMPT}\n\n${content}\n\n请检查并输出 JSON。` },
    ],
    maxTokens: 16000,
    timeoutMs: 300000,
  });
  return parseQa(text);
}

function parseQa(text: string): {
  result: string;
  summary: string;
  findings: QaFinding[];
} {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容无法解析为 JSON");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;

  const result = String(parsed.result ?? "WARNING").toUpperCase();
  const findings = Array.isArray(parsed.findings)
    ? parsed.findings.map((x) => {
        const o = (x ?? {}) as Record<string, unknown>;
        const status = String(o.status ?? "pass").toLowerCase();
        return {
          check: String(o.check ?? ""),
          status: ["pass", "warning", "block"].includes(status) ? status : "pass",
          detail: String(o.detail ?? ""),
        };
      })
    : [];

  return {
    result: ["PASS", "WARNING", "BLOCK"].includes(result) ? result : "WARNING",
    summary: String(parsed.summary ?? ""),
    findings,
  };
}
