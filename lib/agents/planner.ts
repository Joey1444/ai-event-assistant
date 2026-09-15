// Detailed Planning Agent：基于已选方案 + 简报 + 研究 + 事实账本，生成正式活动方案
import { generateText } from "@/lib/ai/provider";
import type { PlanData } from "./types";

const PLANNER_PROMPT = `# 角色
你是一名严谨的活动方案策划师（Detailed Planning Agent）。你的职责是：基于「已选方案」，把它展开成一份正式、可执行的活动方案——补充执行层面的细节（时间、流程、分工、物料、预算），但不改变已选方案的方向和定位。

# 输入
已选方案、项目简报、研究资料库、事实账本。

# 输出 16 个章节（每个都是字符串，多要点用换行或编号列表）
- overview 一、项目概述：这个活动是什么、为什么办
- goals 二、活动目标：具体、可衡量的目标
- theme 三、活动主题：主题与一句话定位
- audience 四、受众：面向谁、预计多少人
- flow 五、活动流程：从入场到结束的完整流程
- program 六、节目设计：具体节目/环节
- interactive 七、互动活动：观众如何参与
- cultural 八、文化内容：中秋文化知识点与呈现方式
- staffing 九、人员分工：每个岗位谁来做什么
- venue 十、场地需求：场地、布局、设备
- materials 十一、物料需求：需要采购/准备的物资清单
- promotion 十二、宣传计划：怎么让目标人群知道并参加
- budget 十三、预算：预算分配（与预算表保持一致）
- risk 十四、风险管理：可能的风险与应对
- dayOfSchedule 十五、活动当天执行表：按时间点的当天流程
- evaluation 十六、评估指标：怎么衡量活动成功

# 输出格式（严格 JSON，只输出 JSON 对象，不要 Markdown 代码块、不要解释文字）
{"overview":"...","goals":"...","theme":"...","audience":"...","flow":"...","program":"...","interactive":"...","cultural":"...","staffing":"...","venue":"...","materials":"...","promotion":"...","budget":"...","risk":"...","dayOfSchedule":"...","evaluation":"..."}

# 硬性规则
1. 基于「已选方案」展开，方向保持一致，不另起炉灶。
2. 所有外部事实（场地、日期、预算、联系人、规定、供应商、价格）必须关联「事实账本」；账本里没有的，不得伪装成确定信息，必须标注 [ASSUMPTION]（假设）或 [UNKNOWN]（未知）。
3. 绝不编造具体事实、价格、场地名、联系人、规定。
4. 预算章节的总额要与项目简报的预算一致。`;

const SECTION_KEYS = [
  "overview",
  "goals",
  "theme",
  "audience",
  "flow",
  "program",
  "interactive",
  "cultural",
  "staffing",
  "venue",
  "materials",
  "promotion",
  "budget",
  "risk",
  "dayOfSchedule",
  "evaluation",
];

export async function runPlanner(input: {
  selectedConceptText: string;
  briefText: string;
  researchText: string;
  factsText: string;
}): Promise<PlanData> {
  const text = await generateText({
    messages: [
      {
        role: "user",
        content: `${PLANNER_PROMPT}\n\n项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n已选方案：\n${input.selectedConceptText}\n\n请生成正式活动方案并输出 JSON。`,
      },
    ],
    maxTokens: 50000,
    timeoutMs: 300000,
  });
  return parsePlan(text);
}

function parsePlan(text: string): PlanData {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/, "");
  const start = cleaned.indexOf("{");
  const end = cleaned.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    throw new Error("AI 返回的内容无法解析为 JSON");
  }
  const parsed = JSON.parse(cleaned.slice(start, end + 1)) as Record<string, unknown>;

  const result: PlanData = {};
  for (const key of SECTION_KEYS) {
    result[key] = String(parsed[key] ?? "");
  }
  return result;
}
