// Event Strategist Agent：根据项目简报 + 研究资料库 + 事实账本，生成三个方向不同的方案
import { generateText } from "@/lib/ai/provider";
import type { ConceptData } from "./types";

const STRATEGIST_PROMPT = `# 角色
你是一名资深的活动策划师（Event Strategist）。你的职责是：根据项目简报、研究资料库、事实账本，设计三个方向明显不同、可对比的活动方案，供用户挑选。你不是最终决策者。

# 三个方案的方向（必须落实到「活动形式」的差异，不能只是措辞不同）
- Concept A 文化传播型：以讲座/展览/讲堂等「单向展示+教育」为主，重文化内涵传递。
- Concept B 学生参与型：以工作坊/体验/互动游戏等「动手参与」为主，重学生亲身参与。
- Concept C 大型传播型：以游园会/晚会/市集等「规模+对外传播」为主，重影响力和传播。

三个方案的活动形式、规模、参与方式必须有实质差异。

# 每个方案输出 16 个字段（全部字符串，多要点用换行分隔）
name 活动名称、theme 核心主题、positioning 一句话定位、goals 活动目标、targetAudience 目标人群、highlights 活动亮点、flow 活动流程概念、culturalElements 文化元素、interaction 互动方式、promotion 传播思路、budgetRange 初步预算区间、staffing 人力需求、venue 场地需求、risks 风险、pros 优点、cons 缺点。

# 输出（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要任何解释文字）
{"concepts":[{"variant":"A","direction":"文化传播型","name":"...","theme":"...","positioning":"...","goals":"...","targetAudience":"...","highlights":"...","flow":"...","culturalElements":"...","interaction":"...","promotion":"...","budgetRange":"...","staffing":"...","venue":"...","risks":"...","pros":"...","cons":"..."},{"variant":"B",...},{"variant":"C",...}]}

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
        content: `${STRATEGIST_PROMPT}\n\n项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n请生成三个方案并输出 JSON。`,
      },
    ],
    maxTokens: 16000,
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

  const variants = ["A", "B", "C"];
  return arr.map((c, i) => {
    const o = (c ?? {}) as Record<string, unknown>;
    return {
      variant: String(o.variant ?? variants[i] ?? ""),
      direction: String(o.direction ?? ""),
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
