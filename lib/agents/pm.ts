// 项目经理（PM Agent）：读取项目简报，判断信息是否充分
// 只做分析，不策划活动、不推进工作流。
import { generateText } from "@/lib/ai/provider";
import type { PmAnalysisData } from "./types";

const PM_ROLE_PROMPT = `# 角色
你是一名严谨的项目经理（Project Manager）。在活动策划开始前，你的唯一职责是给「项目简报」做一次信息体检：判断哪些信息已明确、哪些缺失、哪些只是推测，并给出下一步。你不负责策划活动本身。

# 输入
一份项目简报（含项目名称、主办机构、活动类型/目的/日期/人数/预算/地点/人群/要求/备注；未填写的字段会标注「（未填写）」）。

# 输出（严格 JSON，只输出 JSON 对象本身，不要 Markdown 代码块、不要任何解释文字）
{"summary":"...","knownFacts":[],"missingInformation":[],"assumptions":[],"nextStep":"...","requiresHumanInput":true}

字段含义：
- summary：一句话，说明「已知哪些、缺哪些关键信息」。
- knownFacts：字符串数组，只放简报里明确写出来的事实，逐条列出；不要补充、不要推断。
- missingInformation：字符串数组，简报没写、但对推进策划很关键的信息（日期/地点/预算/人数/目的等）。
- assumptions：字符串数组，你根据常识或上下文推断、但简报没明说的内容——这是推测，不是事实。
- nextStep：基于当前信息，下一步应该做什么（一句话，落到具体动作）。
- requiresHumanInput：若缺失关键条件（日期/地点/预算/人数等）填 true，否则填 false。

# 硬性规则
1. 绝不编造：简报没写的，一律不得进 knownFacts。
2. 无法确定就是缺失：放进 missingInformation。
3. 推测只能进 assumptions：绝不把推断写成事实。
4. 若缺关键条件，requiresHumanInput 必须为 true，并在 nextStep 里明确请用户补充。`;

export async function runPmAnalysis(briefText: string): Promise<PmAnalysisData> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${PM_ROLE_PROMPT}\n\n以下是项目简报：\n${briefText}\n\n请分析并输出 JSON。`,
      },
    ],
    maxTokens: 8000,
  });
  return parseAnalysisJson(text);
}

function parseAnalysisJson(text: string): PmAnalysisData {
  let cleaned = text.trim();
  // 去掉可能出现的 Markdown 代码块包裹
  cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");

  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容无法解析为 JSON");
  }

  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<
    string,
    unknown
  >;

  return {
    summary: String(parsed.summary ?? ""),
    knownFacts: toStrArray(parsed.knownFacts),
    missingInformation: toStrArray(parsed.missingInformation),
    assumptions: toStrArray(parsed.assumptions),
    nextStep: String(parsed.nextStep ?? ""),
    requiresHumanInput: Boolean(parsed.requiresHumanInput),
  };
}

function toStrArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.map((x) => String(x)).filter((s) => s.trim() !== "");
}
