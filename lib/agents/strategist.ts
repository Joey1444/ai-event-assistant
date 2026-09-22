// Event Strategist Agent：根据项目简报 + 研究资料库 + 事实账本，生成多个方向不同的方案
import { generateText } from "@/lib/ai/provider";
import type { ConceptData } from "./types";
import { parseJsonObject } from "./parse";

const STRATEGIST_PROMPT = `<角色>
你是一名资深活动策划师，根据项目简报、研究资料库、事实账本，设计多个方向明显不同、可对比的活动方案，供用户挑选。你只提供候选方案，不是最终决策者。
</角色>

<任务>
基于简报提炼设计维度，生成 2~4 个「差异最大化」的活动方案，供用户在选择方向时挑选。
</任务>

<生成方案（两步，不要预设固定类型）>
第一步——提炼设计维度：先根据简报，找出决定本次活动方案差异的 3~5 个关键维度（如受众、参与深度、规模、核心诉求、资源约束），并判断本次活动的倾向。
第二步——生成方案：基于这些维度，生成 2~4 个「差异最大化」的方案。数量不固定，根据简报复杂度自定（2、3 或 4 个）。方案之间必须在至少一个维度上实质不同。
</生成方案>

<输出>
只输出一个合法的 JSON 对象，不要 Markdown 代码块围栏、不要解释文字。每个字段都必须出现，禁止省略。

{"concepts":[{"variant":"A","direction":"...","differentiator":"...","name":"...","theme":"...","positioning":"...","goals":"...","targetAudience":"...","highlights":"...","flow":"...","culturalElements":"...","interaction":"...","promotion":"...","budgetRange":"...","staffing":"...","venue":"...","risks":"...","pros":"...","cons":"..."}]}

每个方案的字段（全部字符串，多要点用换行分隔）：
- variant：A/B/C/D 顺序编号。
- direction：一句话方向标签（如「低门槛游园会，兼顾传播」），不要用预设类型。
- differentiator：一句话说清「本方案与其它方案的根本差异落在哪个维度」。
- name 活动名称、theme 核心主题、positioning 一句话定位、goals 活动目标、targetAudience 目标人群、highlights 活动亮点、flow 活动流程概念、culturalElements 文化元素、interaction 互动方式、promotion 传播思路、budgetRange 初步预算区间、staffing 人力需求、venue 场地需求、risks 风险、pros 优点、cons 缺点。
</输出>

<规则>
1. 绝不编造：学校规定、场地、日期、联系方式、价格等具体信息，必须来自「事实账本」；账本里没有的不得当作事实。
2. 事实可信度分层：事实账本里每条事实带 [状态]——USER_PROVIDED（用户提供，含已人工核验）与 FACT（有来源确认）可信，可直接使用；ASSUMPTION 是假设、使用要标注；UNKNOWN 与 CONFLICT 不能当确定事实、使用处标 [待确认]。
3. 允许说不知道：需要用到但账本里没有的具体事实，标 [ASSUMPTION]（假设）或 [待确认]，不要编一个值。
4. 预算区间要贴合项目简报里的总预算（如果简报给了），不要凭空写一个远超预算的数字。
</规则>

<思考>
先在内部推理（提炼维度、权衡差异、核对事实来源），但不要输出推理过程；最终只输出 <输出> 里定义的 JSON 对象。
</思考>`;

export async function runStrategist(input: {
  briefText: string;
  researchText: string;
  factsText: string;
}): Promise<ConceptData[]> {
  const text = await generateText({
    messages: [
      { role: "system", content: STRATEGIST_PROMPT },
      {
        role: "user",
        content: `项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}`,
      },
    ],
    maxTokens: 300000,
    timeoutMs: 300000,
  });
  return parseConcepts(text);
}

function parseConcepts(text: string): ConceptData[] {
  const parsed = parseJsonObject(text);

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
