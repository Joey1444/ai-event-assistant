// Critic Agent：给三个方案「找问题」并评分，但不替用户做最终决定
import { generateText } from "@/lib/ai/provider";
import type { CritiqueData, ScoreItem } from "./types";
import { parseJsonObject, toStrArray } from "./parse";

const CRITIC_PROMPT = `# 角色
你是一名严格的评审专家（Critic）。你的唯一职责是给三个活动方案「找问题」，而不是重新写方案，也不是替用户做决定。

# 输入
多个方案、项目简报、研究资料库、事实账本。

# 评分（8 个维度，每项 0-10 分整数，用统一标尺）
分数标尺：9-10 优秀；7-8 良好；5-6 一般；3-4 较差；0-2 严重问题。
- strategicFit 战略契合度：是否贴合项目目的与机构定位
- culturalQuality 文化质量：文化内容是否准确、得体、有深度
- audienceAppeal 受众吸引力：目标人群是否会感兴趣、愿意参加
- feasibility 可行性：场地/人力/时间是否现实可落地
- budget 预算合理性：预算与活动规模是否匹配
- risk 风险（反向计分：分数越高=风险越低=越安全）
- originality 原创性：是否有新意，还是老套
- communicationValue 传播价值：对外宣传、品牌沉淀的价值

每项输出 score（0-10 整数）和 reason（一句话理由，说清扣分点或得分点）。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要任何解释文字）
{"scores":{"strategicFit":{"score":8,"reason":"..."},"culturalQuality":{"score":8,"reason":"..."},"audienceAppeal":{"score":8,"reason":"..."},"feasibility":{"score":8,"reason":"..."},"budget":{"score":8,"reason":"..."},"risk":{"score":8,"reason":"..."},"originality":{"score":8,"reason":"..."},"communicationValue":{"score":8,"reason":"..."}},"strengths":[],"weaknesses":[],"risks":[],"criticalIssues":[],"recommendation":"...","recommendedConcept":"B"}

字段含义：
- strengths / weaknesses / risks：整体层面的字符串数组（可点名具体是哪个 Concept）。
- criticalIssues：严重问题，尤其要主动寻找这 8 类——不现实的预算、不合理的人数、文化错误、没有证据的事实、执行困难、时间冲突、资源不足、潜在风险。
- recommendation：一段评审总结，说清各方案的取舍。
- recommendedConcept：填你要推荐的方案的 variant 值（如 "A"、"B"、"C" 等，按方案实际编号；若无明确推荐填空字符串）——这是 AI 建议，不代表最终决定。

# 事实规则
如果某个方案把未经事实账本验证的信息当作事实，必须在 criticalIssues 里指出。`;

export async function runCritic(input: {
  briefText: string;
  researchText: string;
  factsText: string;
  conceptsText: string;
}): Promise<CritiqueData> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${CRITIC_PROMPT}\n\n项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n三个方案：\n${input.conceptsText}\n\n请评审并输出 JSON。`,
      },
    ],
    maxTokens: 50000,
    timeoutMs: 300000,
  });
  return parseCritique(text);
}

function parseCritique(text: string): CritiqueData {
  const parsed = parseJsonObject(text);
  const scores = (parsed.scores ?? {}) as Record<string, unknown>;

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
  const o = (value ?? {}) as Record<string, unknown>;
  let score = Number(o.score);
  if (!Number.isFinite(score)) score = 0;
  score = Math.max(0, Math.min(10, Math.round(score)));
  return { score, reason: String(o.reason ?? "") };
}
