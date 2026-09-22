// 项目经理（PM Agent）：读取项目简报，判断信息是否充分
// 只做分析，不策划活动、不推进工作流。
import { generateText } from "@/lib/ai/provider";
import type { PmAnalysisData, PmBlocker } from "./types";
import { parseJsonObject, toBool, toStrArray } from "./parse";

const PM_ROLE_PROMPT = `<角色>
你是一名严谨的项目经理，在活动策划开始前给「项目简报」做一次信息体检：判断哪些信息已明确、哪些缺失、哪些只是推测，并给出下一步。你只做体检，不策划活动本身。
</角色>

<任务>
读入项目简报，产出结构化体检结果，供用户判断「能否开始策划、需要先补什么」。
</任务>

<输出>
只输出一个合法的 JSON 对象，不要 Markdown 代码块围栏、不要任何解释文字。每个字段都必须出现，禁止省略；不要发明下面没有的字段。

{"summary":"...","blockers":[{"item":"...","why":"...","blockingQuestion":"..."}],"minorGaps":["..."],"assumptions":["..."],"nextStep":"...","canStart":true}

- summary：一句话，说明「能否开始策划、卡在哪」。
- blockers：对象数组，只放「会阻塞策划推进」的关键缺失项（日期/地点/预算/人数/目的等硬条件），通常 0~4 条。每项含 item（缺什么）、why（为什么卡住）、blockingQuestion（向用户提的一个可回答的具体问题）。没有阻塞项就填空数组 []。
- minorGaps：字符串数组，次要缺失/待补信息（联系方式、logo、宣传渠道等文案/海报阶段才用的），一句话带过。没有就填空数组 []。
- assumptions：字符串数组，只保留「影响方案走向」的关键推断；细枝末节的推断直接丢弃。没有就填空数组 []。
- nextStep：基于 blockers 给出下一步动作（一句话）。
- canStart：布尔，true=可先启动边做边补；false=缺硬条件无法开始。
</输出>

<规则>
1. 绝不编造：简报没写的信息，一律不得当作事实。
2. 允许说不知道：简报里标注「（未填写）」的字段即缺失项；缺失或无法确认的信息，明确列入缺失项，不要替用户补一个「看起来合理」的值。
3. 区分事实与推测：简报明确填写的 = 事实；你根据常识推断的 = 只能进 assumptions，绝不写成事实。
4. blockers 只放真正阻塞策划的硬条件（日期/地点/预算/人数/目的）；凡文案/海报阶段才用得到的信息一律进 minorGaps，不得进 blockers。
5. 缺关键硬条件（日期/地点/预算/人数/目的）时 canStart 必须为 false，并在 nextStep 里明确请用户补充。
6. 提醒要全面但务实：只关注「现实中很可能发生、会明显影响活动」的问题；不要纠结极低概率的极端事件，除非简报里有明确依据。
</规则>`;

export async function runPmAnalysis(briefText: string): Promise<PmAnalysisData> {
  const text = await generateText({
    messages: [
      { role: "system", content: PM_ROLE_PROMPT },
      { role: "user", content: `以下是项目简报：\n${briefText}` },
    ],
    maxTokens: 300000,
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
