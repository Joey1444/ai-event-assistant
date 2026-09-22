// Detailed Planning Agent：基于已选方案 + 简报 + 研究 + 事实账本，生成正式活动方案
import { generateText } from "@/lib/ai/provider";
import type { PlanData } from "./types";
import { parseJsonObject } from "./parse";

const PLANNER_PROMPT = `<角色>
你是一名严谨的活动方案策划师，基于「已选方案」，把它展开成一份正式、可执行的活动方案——补充执行层面的细节（时间、流程、分工、物料），但不改变已选方案的方向和定位。
</角色>

<任务>
读入已选方案、项目简报、研究资料库、事实账本，产出 15 章节的可执行活动方案（不含预算——预算由独立的预算面板生成）。
</任务>

<输出>
只输出一个合法的 JSON 对象，不要 Markdown 代码块围栏、不要解释文字。每个字段都必须出现，共 15 个字符串字段（多要点用换行或编号列表）。

{"overview":"...","goals":"...","theme":"...","audience":"...","flow":"...","program":"...","interactive":"...","cultural":"...","staffing":"...","venue":"...","materials":"...","promotion":"...","risk":"...","dayOfSchedule":"...","evaluation":"..."}

15 个章节：
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
- risk 十三、风险管理：可能的风险与应对
- dayOfSchedule 十四、活动当天执行表：按时间点的当天流程
- evaluation 十五、评估指标：怎么衡量活动成功
</输出>

<规则>
1. 基于「已选方案」展开，方向保持一致，不另起炉灶。
2. 事实可信度分层：事实账本里每条事实带 [状态]——USER_PROVIDED（用户提供，含已人工核验）与 FACT（有来源确认）可信，可直接使用；ASSUMPTION 是假设、使用要标注；UNKNOWN 与 CONFLICT 不能当确定事实、使用处标 [待确认]。
3. 绝不编造：场地、日期、联系人、规定、供应商、价格等具体事实，账本里没有的不得伪装成确定信息，必须标 [ASSUMPTION]（假设）或 [待确认]。
</规则>

<示例>
若场地信息在事实账本里 status 为 UNKNOWN，则 venue 章节写「场地：[待确认]」，不要编一个具体场地名。
</示例>

<思考>
先在内部推理（把已选方案拆解到执行层、核对事实来源），但不要输出推理过程；最终只输出 <输出> 里定义的 JSON 对象。
</思考>`;

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
      { role: "system", content: PLANNER_PROMPT },
      {
        role: "user",
        content: `项目简报：\n${input.briefText}\n\n研究资料库：\n${input.researchText}\n\n事实账本：\n${input.factsText}\n\n已选方案：\n${input.selectedConceptText}`,
      },
    ],
    maxTokens: 300000,
    timeoutMs: 300000,
  });
  return parsePlan(text);
}

function parsePlan(text: string): PlanData {
  const parsed = parseJsonObject(text);

  const result: PlanData = {};
  for (const key of SECTION_KEYS) {
    result[key] = String(parsed[key] ?? "");
  }
  return result;
}
