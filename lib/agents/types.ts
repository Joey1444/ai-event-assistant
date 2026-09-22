// Agent 相关类型与常量（供服务端与客户端共用）

export type PmBlocker = {
  item: string;
  why: string;
  blockingQuestion: string;
};

export type PmAnalysisData = {
  summary: string;
  blockers: PmBlocker[];
  minorGaps: string[];
  assumptions: string[];
  nextStep: string;
  canStart: boolean;
};

export type AnalyzeResult =
  | { ok: true; analysis: PmAnalysisData }
  | { ok: false; error: string };

// 活动方案（Concept）的 16 个字段，全部为字符串
export type ConceptData = {
  variant: string;
  direction: string;
  differentiator?: string;
  name: string;
  theme: string;
  positioning: string;
  goals: string;
  targetAudience: string;
  highlights: string;
  flow: string;
  culturalElements: string;
  interaction: string;
  promotion: string;
  budgetRange: string;
  staffing: string;
  venue: string;
  risks: string;
  pros: string;
  cons: string;
};

export const CONCEPT_FIELD_ORDER = [
  "name",
  "theme",
  "positioning",
  "goals",
  "targetAudience",
  "highlights",
  "flow",
  "culturalElements",
  "interaction",
  "promotion",
  "budgetRange",
  "staffing",
  "venue",
  "risks",
  "pros",
  "cons",
] as const;

export const CONCEPT_FIELD_LABELS: Record<string, string> = {
  name: "活动名称",
  theme: "核心主题",
  positioning: "一句话定位",
  goals: "活动目标",
  targetAudience: "目标人群",
  highlights: "活动亮点",
  flow: "活动流程概念",
  culturalElements: "文化元素",
  interaction: "互动方式",
  promotion: "传播思路",
  budgetRange: "初步预算区间",
  staffing: "人力需求",
  venue: "场地需求",
  risks: "风险",
  pros: "优点",
  cons: "缺点",
};

export type ScoreItem = { score: number; reason: string };

export type CritiqueScores = {
  strategicFit: ScoreItem;
  culturalQuality: ScoreItem;
  audienceAppeal: ScoreItem;
  feasibility: ScoreItem;
  budget: ScoreItem;
  risk: ScoreItem;
  originality: ScoreItem;
  communicationValue: ScoreItem;
};

export type CritiqueData = {
  scores: CritiqueScores;
  strengths: string[];
  weaknesses: string[];
  risks: string[];
  criticalIssues: string[];
  recommendation: string;
  recommendedConcept: string;
};

export const CRITIQUE_SCORE_ORDER = [
  "strategicFit",
  "culturalQuality",
  "audienceAppeal",
  "feasibility",
  "budget",
  "risk",
  "originality",
  "communicationValue",
] as const;

export const CRITIQUE_SCORE_LABELS: Record<string, string> = {
  strategicFit: "战略契合度",
  culturalQuality: "文化质量",
  audienceAppeal: "受众吸引力",
  feasibility: "可行性",
  budget: "预算合理性",
  risk: "风险",
  originality: "原创性",
  communicationValue: "传播价值",
};

export type GenerateConceptsResult =
  | { ok: true; concepts: ConceptData[] }
  | { ok: false; error: string };

export type CritiqueResult =
  | { ok: true; critique: CritiqueData }
  | { ok: false; error: string };

export type FactData = {
  id?: string;
  claim: string;
  evidence: string;
  source: string;
  sourceUrl: string;
  confidence: string;
  status: string;
  reason: string;
  requiresHumanVerification: boolean;
  verification?: string | null;
  humanNote?: string;
};

export type FactCheckResult =
  | { ok: true; facts: FactData[] }
  | { ok: false; error: string };

export const FACT_STATUS_LABELS: Record<string, string> = {
  FACT: "已确认",
  USER_PROVIDED: "用户提供",
  ASSUMPTION: "假设",
  UNKNOWN: "未知",
  CONFLICT: "冲突",
};

export const RESULT_LABELS: Record<string, string> = {
  PASS: "通过",
  WARNING: "有警告",
  BLOCK: "有问题，建议修改",
};

export const CONFIDENCE_LABELS: Record<string, string> = {
  high: "高",
  medium: "中",
  low: "低",
};

export type DecisionData = {
  selectedConcept: string | null;
  rejected: boolean;
  selectedBy: string;
  decisionNote: string;
  createdAt: string;
};

export type DecisionResult =
  | { ok: true; decision: DecisionData }
  | { ok: false; error: string };

export type PlanData = Record<string, string>;

export type ActivityPlanData = {
  version: number;
  content: PlanData;
  createdByAgent: string;
  createdAt: string;
};

export type GeneratePlanResult =
  | { ok: true; plan: ActivityPlanData }
  | { ok: false; error: string };

export type SavePlanVersionResult =
  | { ok: true; plan: ActivityPlanData }
  | { ok: false; error: string };

export const PLAN_SECTIONS = [
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
] as const;

export const PLAN_SECTION_LABELS: Record<string, string> = {
  overview: "一、项目概述",
  goals: "二、活动目标",
  theme: "三、活动主题",
  audience: "四、受众",
  flow: "五、活动流程",
  program: "六、节目设计",
  interactive: "七、互动活动",
  cultural: "八、文化内容",
  staffing: "九、人员分工",
  venue: "十、场地需求",
  materials: "十一、物料需求",
  promotion: "十二、宣传计划",
  budget: "十三、预算",
  risk: "十四、风险管理",
  dayOfSchedule: "十五、活动当天执行表",
  evaluation: "十六、评估指标",
};

export type BudgetItemData = {
  category: string;
  item: string;
  quantity: number;
  unit: string;
  unitPrice: number;
  notes: string;
  source: string;
  confidence: string;
};

export type BudgetData = {
  version: number;
  currency: string;
  contingencyRate: number;
  total: number;
  summary: string;
  costRisks: string[];
  items: BudgetItemData[];
  createdByAgent: string;
  createdAt: string;
};

export type GenerateBudgetResult =
  | { ok: true; budget: BudgetData }
  | { ok: false; error: string };

export type SaveBudgetResult =
  | { ok: true; budget: BudgetData }
  | { ok: false; error: string };

export const BUDGET_CATEGORIES = [
  "Venue",
  "Decoration",
  "Food",
  "Printing",
  "Equipment",
  "Transportation",
  "Gifts",
  "Staff",
  "Marketing",
  "Miscellaneous",
] as const;

export const BUDGET_CATEGORY_LABELS: Record<string, string> = {
  Venue: "场地",
  Decoration: "装饰",
  Food: "食品",
  Printing: "印刷",
  Equipment: "设备",
  Transportation: "交通",
  Gifts: "礼品",
  Staff: "人员",
  Marketing: "宣传",
  Miscellaneous: "其他",
};

export const BUDGET_SOURCE_LABELS: Record<string, string> = {
  ASSUMPTION: "假设",
  USER_PROVIDED: "用户提供",
  SOURCE_BASED: "资料来源",
};

export type VersionedContentData = {
  version: number;
  content: Record<string, string>;
  createdByAgent: string;
  createdAt: string;
};

export type ContentResult =
  | { ok: true; data: VersionedContentData }
  | { ok: false; error: string };

export const COPY_FIELDS = [
  "formalTitle",
  "introZh",
  "introEn",
  "socialMedia",
] as const;

export const COPY_FIELD_LABELS: Record<string, string> = {
  formalTitle: "活动正式标题",
  introZh: "中文活动简介",
  introEn: "英文活动简介",
  socialMedia: "社交媒体短文",
};

export const POSTER_FIELDS = [
  "headline",
  "subtitle",
  "eventDate",
  "eventTime",
  "venue",
  "organizer",
  "callToAction",
  "contact",
  "visualTheme",
  "culturalElements",
] as const;

export const POSTER_FIELD_LABELS: Record<string, string> = {
  headline: "主标题",
  subtitle: "副标题",
  eventDate: "活动日期",
  eventTime: "活动时间",
  venue: "活动地点",
  organizer: "主办机构",
  callToAction: "行动号召",
  contact: "联系方式",
  visualTheme: "视觉主题",
  culturalElements: "文化元素",
};

export type PosterImageData = {
  id: string;
  version: number;
  imageDataUrl: string;
  prompt: string;
  editInstruction: string;
  parentVersion: number | null;
  createdByAgent: string;
  createdAt: string;
};

export type PosterImageResult =
  | { ok: true; images: PosterImageData[] }
  | { ok: false; error: string };

export type QaFinding = {
  check: string;
  status: string;
  detail: string;
};

export type FinalQaData = {
  result: string;
  summary: string;
  findings: QaFinding[];
};

export type FinalQaRecord = FinalQaData & {
  version: number;
  createdByAgent: string;
  createdAt: string;
};

export type FinalQaResult =
  | { ok: true; qa: FinalQaRecord }
  | { ok: false; error: string };

export type ApprovalData = {
  decision: string;
  approvedBy: string;
  approvalNote: string;
  approvedAt: string;
};

export type ApprovalResult =
  | { ok: true; approval: ApprovalData }
  | { ok: false; error: string };
