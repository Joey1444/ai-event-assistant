// Event Strategist Agent：根据项目简报 + 研究资料库 + 事实账本，生成三个方向不同的方案
import { generateText } from "@/lib/ai/provider";
import type { ConceptData } from "./types";

const STRATEGIST_PROMPT = `# 角色
你是一名资深的活动策划师（Event Strategist）。你的职责是：根据项目简报、研究资料库、事实账本，设计多个方向明显不同、可对比的活动方案，供用户挑选。你不是最终决策者。

# 生成方案（两步，不要预设固定类型）
第一步——提炼设计维度：先根据简报，找出决定本次活动方案差异的 3~5 个关键维度（如受众、参与深度、规模、核心诉求、资源约束），并判断本次活动的倾向。
第二步——生成方案：基于这些维度，生成 2~4 个「差异最大化」的方案。数量不固定，根据简报复杂度自定（2、3 或 4 个）。每个方案的 direction 是你自拟的一句话方向标签（如「低门槛游园会，兼顾传播」），不要用预设类型；differentiator 用一句话说清「本方案与其它方案的根本差异落在哪个维度」。方案之间必须在至少一个维度上实质不同。

# 每个方案输出这些字段（全部字符串，多要点用换行分隔）
variant（A/B/C/D 顺序编号）、direction（自拟方向标签）、differentiator（与其它方案的差异点）、name 活动名称、theme 核心主题、positioning 一句话定位、goals 活动目标、targetAudience 目标人群、highlights 活动亮点、flow 活动流程概念、culturalElements 文化元素、interaction 互动方式、promotion 传播思路、budgetRange 初步预算区间、staffing 人力需求、venue 场地需求、risks 风险、pros 优点、cons 缺点。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要任何解释文字）
{"concepts":[{"variant":"A","direction":"...","differentiator":"...","name":"...","theme":"...","positioning":"...","goals":"...","targetAudience":"...","highlights":"...","flow":"...","culturalElements":"...","interaction":"...","promotion":"...","budgetRange":"...","staffing":"...","venue":"...","risks":"...","pros":"...","cons":"..."}]}

# 事实规则（极其重要）
1. 任何关于学校规定、场地、日期、联系方式、价格等具体信息，必须来自「事实账本」。
2. 事实账本里没有的信息，不得当作事实；需要在方案中体现时，必须明确标注 [ASSUMPTION]（假设）。
3. 绝不编造具体事实、场地名、联系人、价格、规定。
4. 预算区间要贴合项目简报里的总预算（如果简报给了），不要凭空写一个远超预算的数字。`;

export async function runStrategist(input: {
  briefText: string;
  researchText: string;
  factsText: string;
}): Promise<ConceptData[]> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${STRATEGIST_PROMPT}\n\n项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n请生成方案并输出 JSON。`,
      },
    ],
    maxTokens: 50000,
    timeoutMs: 300000,
  });
  return parseConcepts(text);
}

function parseConcepts(text: string): ConceptData[] {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容无法解析为 JSON");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;

  const arr = Array.isArray(parsed) ? parsed : parsed.concepts;
  if (!Array.isArray(arr)) {
    throw new Error("无法解析方案数组");
  }

  const variants = ["A", "B", "C", "D"];
  return arr.map((c, i) => {
    const o = (c ?? {}) as Record<string, unknown>;
    return {
      variant: String(o.variant ?? variants[i] ?? ""),
      direction: String(o.direction ?? ""),
      differentiator: String(o.differentiator ?? ""),
      name: String(o.name ?? ""),
      theme: String(o.theme ?? ""),
      positioning: String(o.positioning ?? ""),
      goals: String(o.goals ?? ""),
      targetAudience: String(o.targetAudience ?? ""),
      highlights: String(o.highlights ?? ""),
      flow: String(o.flow ?? ""),
      culturalElements: String(o.culturalElements ?? ""),
      interaction: String(o.interaction ?? ""),
      promotion: String(o.promotion ?? ""),
      budgetRange: String(o.budgetRange ?? ""),
      staffing: String(o.staffing ?? ""),
      venue: String(o.venue ?? ""),
      risks: String(o.risks ?? ""),
      pros: String(o.pros ?? ""),
      cons: String(o.cons ?? ""),
    };
  });
}
