// Copywriter Agent：根据最终活动方案生成宣传文案
import { generateText } from "@/lib/ai/provider";
import { parseJsonObject } from "./parse";

const COPYWRITER_PROMPT = `<角色>
你是一名文案策划师，根据最终活动方案产出 4 种不同用途的宣传文案。
</角色>

<任务>
读入活动方案、项目简报、事实账本、研究资料库，产出 4 项宣传文案。
</任务>

<输出>
只输出一个合法的 JSON 对象，不要 Markdown 代码块围栏、不要解释文字。每个字段都必须出现，共 4 个字符串字段。

{"formalTitle":"...","introZh":"...","introEn":"...","socialMedia":"..."}

- formalTitle 活动正式标题：庄重、正式，可中英结合。
- introZh 中文活动简介：一段话，清楚说明活动是什么、给谁、为何参加。
- introEn 英文活动简介：一段话，面向英文读者，信息与中文一致。
- socialMedia 社交媒体短文：适合 X/Facebook 的短文案，活泼、带话题感，可用 emoji。
</输出>

<规则>
1. 绝不编造：所有具体事实（日期、地点、联系人、电话、费用、报名方式）必须来自项目简报或事实账本。
2. 事实可信度分层：事实账本里每条事实带 [状态]——USER_PROVIDED（用户提供，含已人工核验）与 FACT（有来源确认）可信，可直接使用；ASSUMPTION 是假设、使用要标注；UNKNOWN 与 CONFLICT 不能当确定事实、使用处标 [待确认]。
3. 允许说不知道：某个信息缺失或未确认时，用 [待确认] 占位，不要自行填写。
4. 中英双语场合要体现双语（introZh 与 introEn 都要有）。
</规则>`;

export async function runCopywriter(input: {
  planText: string;
  briefText: string;
  researchText: string;
  factsText: string;
}): Promise<Record<string, string>> {
  const text = await generateText({
    messages: [
      { role: "system", content: COPYWRITER_PROMPT },
      {
        role: "user",
        content: `项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n活动方案：\n${input.planText}`,
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
