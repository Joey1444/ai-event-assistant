// Poster Agent：根据最终活动方案生成海报文案与视觉要素
import { generateText } from "@/lib/ai/provider";

const POSTER_PROMPT = `# 角色
你是一名海报设计师（Poster Agent）。你的职责是：根据最终活动方案，提炼出做一张海报所需的全部文案与视觉要素，供后续网页设计（Web Design）生成 HTML 海报使用。

# 输入
活动方案、项目简报、事实账本、研究资料库。

# 输出 10 项（全部字符串）
- headline 主标题：大字、简短有力（≤12 字）。
- subtitle 副标题：一句补充，可中英结合。
- eventDate 活动日期
- eventTime 活动时间
- venue 活动地点
- organizer 主办机构
- callToAction 行动号召（如"欢迎参加""免费入场"）
- contact 联系方式
- visualTheme 视觉主题：给出明确配色方向（如"深蓝夜空+金色月光"），供设计阶段使用。
- culturalElements 文化元素：点出可用的中秋视觉元素（如满月、灯笼、月饼、桂花）。

# 事实规则（极其重要）
1. eventDate、eventTime、venue、organizer、contact 必须来自项目简报或事实账本。
2. 信息缺失或未确认时，用 [待确认] 占位，不得自行编造。
3. 事实账本中 UNKNOWN/CONFLICT/ASSUMPTION 的信息，不要当作确定事实。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要解释文字）
{"headline":"...","subtitle":"...","eventDate":"...","eventTime":"...","venue":"...","organizer":"...","callToAction":"...","contact":"...","visualTheme":"...","culturalElements":"..."}`;

export async function runPoster(input: {
  planText: string;
  briefText: string;
  researchText: string;
  factsText: string;
}): Promise<Record<string, string>> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${POSTER_PROMPT}\n\n项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n活动方案：\n${input.planText}\n\n请生成海报内容并输出 JSON。`,
      },
    ],
    maxTokens: 50000,
    timeoutMs: 300000,
  });
  return parseFields(text);
}

function parseFields(text: string): Record<string, string> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容无法解析为 JSON");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
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
