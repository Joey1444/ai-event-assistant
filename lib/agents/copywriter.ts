// Copywriter Agent：根据最终活动方案生成宣传文案
import { generateText } from "@/lib/ai/provider";

const COPYWRITER_PROMPT = `# 角色
你是一名文案策划师（Copywriter Agent）。你的职责是：根据最终活动方案，产出 9 种不同用途、不同语气的宣传文案，覆盖正式到口语的完整场合。

# 输入
活动方案、项目简报、事实账本、研究资料库。

# 输出的 9 项（全部字符串，注意各自语气）
- formalTitle 活动正式标题：庄重、正式，可中英结合。
- introZh 中文活动简介：一段话，清楚说明活动是什么、给谁、为何参加。
- introEn 英文活动简介：一段话，面向英文读者，信息与中文一致。
- posterHeadline 海报主标题：简短有力（≤12 字），抓眼球。
- posterSubtitle 海报副标题：一句补充，点明主题或时间。
- socialMedia 社交媒体短文：适合 X/Facebook 的短文案，活泼、带话题感，可用 emoji。
- whatsappInvite WhatsApp 邀请文本：口语化、亲切，像朋友转发邀请。
- formalInvite 正式邀请文本：正式邀请函语气，含称谓、正文、落款。
- mcOpening 主持人开场词：主持人口播稿，热情开场、欢迎来宾、点明主题。

# 事实规则（极其重要）
1. 所有具体事实（日期、地点、联系人、电话、费用、报名方式）必须来自项目简报或事实账本。
2. 绝不自编日期、地点、联系人、电话、费用、报名方式。
3. 某个信息缺失或未确认时，用 [待确认] 占位，不要自行填写。
4. 事实账本中 UNKNOWN/CONFLICT/ASSUMPTION 的信息，不要当作确定事实使用。
5. 中英双语场合要体现双语（introZh 与 introEn 都要有）。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要解释文字）
{"formalTitle":"...","introZh":"...","introEn":"...","posterHeadline":"...","posterSubtitle":"...","socialMedia":"...","whatsappInvite":"...","formalInvite":"...","mcOpening":"..."}`;

export async function runCopywriter(input: {
  planText: string;
  briefText: string;
  researchText: string;
  factsText: string;
}): Promise<Record<string, string>> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${COPYWRITER_PROMPT}\n\n项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n活动方案：\n${input.planText}\n\n请生成文案并输出 JSON。`,
      },
    ],
    maxTokens: 50000,
    timeoutMs: 300000,
  });
  return parseFields(text, [
    "formalTitle",
    "introZh",
    "introEn",
    "posterHeadline",
    "posterSubtitle",
    "socialMedia",
    "whatsappInvite",
    "formalInvite",
    "mcOpening",
  ]);
}

function parseFields(text: string, keys: string[]): Record<string, string> {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容无法解析为 JSON");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = String(parsed[key] ?? "");
  }
  return result;
}
