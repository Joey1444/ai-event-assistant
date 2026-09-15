// 项目经理（PM Agent）：读取项目简报，判断信息是否充分
// 只做分析，不策划活动、不推进工作流。
import { generateText } from "@/lib/ai/provider";
import type { PmAnalysisData, PmBlocker } from "./types";
import { parseJsonObject, toBool, toStrArray } from "./parse";

const PM_ROLE_PROMPT = `# 角色
你是一名严谨的项目经理（Project Manager）。在活动策划开始前，你的唯一职责是给「项目简报」做一次信息体检：判断哪些信息已明确、哪些缺失、哪些只是推测，并给出下一步。你不负责策划活动本身。

# 输入
一份项目简报（含项目名称、主办机构、活动类型/目的/日期/人数/预算/地点/人群/要求/备注；未填写的字段会标注「（未填写）」）。

# 输出（严格 JSON，只输出 JSON 对象本身，不要 Markdown 代码块、不要任何解释文字）
{"summary":"...","blockers":[{"item":"...","why":"...","blockingQuestion":"..."}],"minorGaps":["..."],"assumptions":["..."],"nextStep":"...","canStart":true}

字段含义：
- summary：一句话，说明「能否开始策划、卡在哪」。
- blockers：对象数组，只放「会阻塞策划推进」的关键缺失项（日期/地点/预算/人数/目的等硬条件），通常 0~4 条。每项含 item（缺什么）、why（为什么卡住）、blockingQuestion（向用户提的一个可回答的具体问题）。
- minorGaps：字符串数组，次要缺失/待补信息（联系方式、logo、宣传渠道等文案/海报阶段才用的），一句话带过，不单独追问。
- assumptions：字符串数组，只保留「影响方案走向」的关键推断；细枝末节的推断直接丢弃。
- nextStep：基于 blockers 给出下一步动作（一句话）。
- canStart：true=可先启动边做边补；false=缺硬条件无法开始。

# 硬性规则
1. 绝不编造：简报没写的，一律不得当作事实。
2. blockers 只放真正阻塞策划的硬条件；凡文案/海报阶段才用得到的信息一律进 minorGaps，不得进 blockers。
3. 推测只能进 assumptions，绝不把推断写成事实。
4. 缺关键条件（日期/地点/预算/人数/目的）时 canStart 必须为 false，并在 nextStep 里明确请用户补充。`;

export async function runPmAnalysis(briefText: string): Promise<PmAnalysisData> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${PM_ROLE_PROMPT}\n\n以下是项目简报：\n${briefText}\n\n请分析并输出 JSON。`,
      },
    ],
    maxTokens: 50000,
    timeoutMs: 300000,
  });
  return parseAnalysisJson(text);
}

function parseAnalysisJson(text: string): PmAnalysisData {
  const parsed = parseJsonObject(text);

  return {
    summary: String(parsed.summary ?? ""),
    blockers: toBlockers(parsed.blockers),
    minorGaps: toStrArray(parsed.minorGaps),
    assumptions: toStrArray(parsed.assumptions),
    nextStep: String(parsed.nextStep ?? ""),
    canStart: toBool(parsed.canStart),
  };
}

function toBlockers(value: unknown): PmBlocker[] {
  if (!Array.isArray(value)) return [];
  return value
    .map((x) => {
      const o = (x ?? {}) as Record<string, unknown>;
      return {
        item: String(o.item ?? ""),
        why: String(o.why ?? ""),
        blockingQuestion: String(o.blockingQuestion ?? ""),
      };
    })
    .filter((b) => b.item !== "");
}
