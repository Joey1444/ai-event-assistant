// Copywriter Agent：根据最终活动方案生成宣传文案
import { generateText } from "@/lib/ai/provider";
import { parseJsonObject } from "./parse";

const COPYWRITER_PROMPT = `# 角色
你是一名文案策划师（Copywriter Agent）。你的职责是：根据最终活动方案，产出 4 种不同用途的宣传文案。

# 输入
活动方案、项目简报、事实账本、研究资料库。

# 输出的 4 项（全部字符串，注意各自语气）
- formalTitle 活动正式标题：庄重、正式，可中英结合。
- introZh 中文活动简介：一段话，清楚说明活动是什么、给谁、为何参加。
- introEn 英文活动简介：一段话，面向英文读者，信息与中文一致。
- socialMedia 社交媒体短文：适合 X/Facebook 的短文案，活泼、带话题感，可用 emoji。

# 事实规则（极其重要）
1. 所有具体事实（日期、地点、联系人、电话、费用、报名方式）必须来自项目简报或事实账本。
2. 绝不自编日期、地点、联系人、电话、费用、报名方式。
3. 某个信息缺失或未确认时，用 [待确认] 占位，不要自行填写。
4. 事实账本中 UNKNOWN/CONFLICT/ASSUMPTION 的信息，不要当作确定事实使用。
5. 中英双语场合要体现双语（introZh 与 introEn 都要有）。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要解释文字）
{"formalTitle":"...","introZh":"...","introEn":"...","socialMedia":"..."}`;

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
    maxTokens: 300000,
    timeoutMs: 300000,
  });
  return parseFields(text, [
    "formalTitle",
    "introZh",
    "introEn",
    "socialMedia",
  ]);
}

function parseFields(text: string, keys: string[]): Record<string, string> {
  const parsed = parseJsonObject(text);
  const result: Record<string, string> = {};
  for (const key of keys) {
    result[key] = String(parsed[key] ?? "");
  }
  return result;
}
