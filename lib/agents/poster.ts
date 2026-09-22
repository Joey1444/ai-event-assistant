// Poster Agent：根据最终活动方案生成海报文案与视觉要素
import { generateText } from "@/lib/ai/provider";
import { parseJsonObject } from "./parse";

const POSTER_PROMPT = `<角色>
你是一名海报设计师，根据最终活动方案，提炼出做一张海报所需的全部文案与视觉要素，供后续海报制作使用。
</角色>

<任务>
读入活动方案、项目简报、事实账本、研究资料库，产出 10 项海报字段。
</任务>

<输出>
只输出一个合法的 JSON 对象，不要 Markdown 代码块围栏、不要解释文字。每个字段都必须出现，共 10 个字符串字段。

{"headline":"...","subtitle":"...","eventDate":"...","eventTime":"...","venue":"...","organizer":"...","callToAction":"...","contact":"...","visualTheme":"...","culturalElements":"..."}

- headline 主标题：大字、简短有力（≤12 字）。
- subtitle 副标题：一句补充，可中英结合。
- eventDate 活动日期、eventTime 活动时间、venue 活动地点、organizer 主办机构。
- callToAction 行动号召（如"欢迎参加""免费入场"）。
- contact 联系方式。
- visualTheme 视觉主题：给出明确配色方向（如"深蓝夜空+金色月光"），供设计阶段使用。
- culturalElements 文化元素：点出可用的中秋视觉元素（如满月、灯笼、月饼、桂花）。
</输出>

<规则>
1. 绝不编造：eventDate、eventTime、venue、organizer、contact 必须来自项目简报或事实账本。
2. 事实可信度分层：事实账本里每条事实带 [状态]——USER_PROVIDED（用户提供，含已人工核验）与 FACT（有来源确认）可信，可直接使用；ASSUMPTION 是假设、使用要标注；UNKNOWN 与 CONFLICT 不能当确定事实、使用处标 [待确认]。
3. 允许说不知道：信息缺失或未确认时，用 [待确认] 占位，不得自行编造。
</规则>`;

export async function runPoster(input: {
  planText: string;
  briefText: string;
  researchText: string;
  factsText: string;
}): Promise<Record<string, string>> {
  const text = await generateText({
    messages: [
      { role: "system", content: POSTER_PROMPT },
      {
        role: "user",
        content: `项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n活动方案：\n${input.planText}`,
      },
    ],
    maxTokens: 300000,
    timeoutMs: 300000,
  });
  return parseFields(text);
}

function parseFields(text: string): Record<string, string> {
  const parsed = parseJsonObject(text);
  const keys = [
    "headline",
    "subtitle",
    "eventDate",
    "eventTime",
    "venue",
    "organizer",
    "callToAction",
    "contact",
    "visualTheme",
    "culturalElements",
  ];
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = String(parsed[key] ?? "");
  }
  return result;
}
