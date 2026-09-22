// Critic Agent：给三个方案「找问题」并评分，但不替用户做最终决定
import { generateText } from "@/lib/ai/provider";
import type { CritiqueData, ScoreItem } from "./types";
import { parseJsonObject, toStrArray } from "./parse";

const CRITIC_PROMPT = `<角色>
你是一名严格的评审专家，给多个活动方案「找问题」并评分。你只评审、不重写方案、不替用户做最终决定。
</角色>

<任务>
读入多个方案、项目简报、研究资料库、事实账本，产出 8 维评分 + 优缺点 + 风险 + 推荐（AI 建议，不代表最终决定）。
</任务>

<输出>
只输出一个合法的 JSON 对象，不要 Markdown 代码块围栏、不要解释文字。每个字段都必须出现。

{"scores":{"strategicFit":{"score":8,"reason":"..."},"culturalQuality":{"score":8,"reason":"..."},"audienceAppeal":{"score":8,"reason":"..."},"feasibility":{"score":8,"reason":"..."},"budget":{"score":8,"reason":"..."},"risk":{"score":8,"reason":"..."},"originality":{"score":8,"reason":"..."},"communicationValue":{"score":8,"reason":"..."}},"strengths":[],"weaknesses":[],"risks":[],"criticalIssues":[],"recommendation":"...","recommendedConcept":"B"}

评分 8 个维度（每项 score 是 0-10 整数，reason 是一句话理由，说清扣分点或得分点）：
- strategicFit 战略契合度：是否贴合项目目的与机构定位
- culturalQuality 文化质量：文化内容是否准确、得体、有深度
- audienceAppeal 受众吸引力：目标人群是否会感兴趣、愿意参加
- feasibility 可行性：场地/人力/时间是否现实可落地
- budget 预算合理性：预算与活动规模是否匹配
- risk 风险（反向计分：分数越高=风险越低）
- originality 原创性：是否有新意，还是老套
- communicationValue 传播价值：对外宣传、品牌沉淀的价值
- 分数标尺：9-10 优秀；7-8 良好；5-6 一般；3-4 较差；0-2 严重问题。

- strengths / weaknesses / risks：整体层面的字符串数组（可点名具体是哪个 Concept）。没有就填空数组 []。
- criticalIssues：严重问题数组，尤其主动寻找这 8 类——不现实的预算、不合理的人数、文化错误、没有证据的事实、执行困难、时间冲突、资源不足、潜在风险。
- recommendation：一段评审总结，说清各方案的取舍。
- recommendedConcept：填推荐的方案 variant 值（如 "A"、"B"、"C"），这是 AI 建议、不代表最终决定；无明确推荐填空字符串 ""。
</输出>

<规则>
1. 事实可信度分层：事实账本里每条事实带 [状态]——USER_PROVIDED（用户提供，含已人工核验）与 FACT（有来源确认）可信；ASSUMPTION 是假设；UNKNOWN 与 CONFLICT 未确认/矛盾。若某个方案把未经账本验证的信息当作确定事实，必须在 criticalIssues 里指出。
2. 允许说不知道：拿不准的维度，据实给低分并说明理由，不要给一个没有依据的高分。
3. 只评审不重写：不要替用户修改方案，也不要替用户做最终决定。
</规则>

<思考>
先在内部推理（逐方案核对事实来源、权衡各维度），但不要输出推理过程；最终只输出 <输出> 里定义的 JSON 对象。
</思考>`;

export async function runCritic(input: {
  briefText: string;
  researchText: string;
  factsText: string;
  conceptsText: string;
}): Promise<CritiqueData> {
  const text = await generateText({
    messages: [
      { role: "system", content: CRITIC_PROMPT },
      {
        role: "user",
        content: `项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n方案：\n${input.conceptsText}`,
      },
    ],
    maxTokens: 300000,
    timeoutMs: 300000,
  });
  return parseCritique(text);
}

function parseCritique(text: string): CritiqueData {
  const parsed = parseJsonObject(text);
  const rawScores = parsed.scores;

  // 兼容：模型可能把 scores 输出成数组（每项是一个维度），统一转成对象再取
  const scores: Record<string, unknown> = {};
  if (Array.isArray(rawScores)) {
    for (const item of rawScores) {
      if (item && typeof item === "object") {
        for (const [k, v] of Object.entries(item as Record<string, unknown>)) {
          scores[k] = v;
        }
      }
    }
  } else if (rawScores && typeof rawScores === "object") {
    Object.assign(scores, rawScores);
  }

  return {
    scores: {
      strategicFit: scoreItem(scores.strategicFit),
      culturalQuality: scoreItem(scores.culturalQuality),
      audienceAppeal: scoreItem(scores.audienceAppeal),
      feasibility: scoreItem(scores.feasibility),
      budget: scoreItem(scores.budget),
      risk: scoreItem(scores.risk),
      originality: scoreItem(scores.originality),
      communicationValue: scoreItem(scores.communicationValue),
    },
    strengths: toStrArray(parsed.strengths),
    weaknesses: toStrArray(parsed.weaknesses),
    risks: toStrArray(parsed.risks),
    criticalIssues: toStrArray(parsed.criticalIssues),
    recommendation: String(parsed.recommendation ?? ""),
    recommendedConcept: String(parsed.recommendedConcept ?? ""),
  };
}

function scoreItem(value: unknown): ScoreItem {
  // 兼容：维度值可能是纯数字、字符串数字、或 {score, reason} 对象
  if (typeof value === "number") {
    return { score: clampScore(value), reason: "" };
  }
  if (typeof value === "string" && value.trim() !== "") {
    const n = Number(value);
    if (Number.isFinite(n)) return { score: clampScore(n), reason: "" };
  }
  const o = (value ?? {}) as Record<string, unknown>;
  return { score: clampScore(Number(o.score)), reason: String(o.reason ?? "") };
}

function clampScore(n: number): number {
  if (!Number.isFinite(n)) return 0;
  return Math.max(0, Math.min(10, Math.round(n)));
}
