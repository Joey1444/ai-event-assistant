// 项目状态（顺序即推进顺序）
export const PROJECT_STATUSES = [
  "DRAFT",
  "RESEARCH",
  "CONCEPT",
  "REVIEW",
  "HUMAN_DECISION",
  "HUMAN_DECISION_COMPLETED",
  "PLANNING",
  "PRODUCTION",
  "FINAL_REVIEW",
  "APPROVED",
  "REJECTED",
  "REVISION_REQUIRED",
] as const;
export type ProjectStatus = (typeof PROJECT_STATUSES)[number];

export const STATUS_LABELS: Record<ProjectStatus, string> = {
  DRAFT: "草稿",
  RESEARCH: "调研",
  CONCEPT: "方案构思",
  REVIEW: "AI 评审",
  HUMAN_DECISION: "待选择方向",
  HUMAN_DECISION_COMPLETED: "已选择方向",
  PLANNING: "方案制定",
  PRODUCTION: "内容制作",
  FINAL_REVIEW: "最终评审",
  APPROVED: "已批准",
  REJECTED: "已驳回",
  REVISION_REQUIRED: "需修改",
};

export const STATUS_TONES: Record<
  ProjectStatus,
  "dark" | "muted" | "green" | "amber" | "red"
> = {
  DRAFT: "muted",
  RESEARCH: "dark",
  CONCEPT: "dark",
  REVIEW: "dark",
  HUMAN_DECISION: "amber",
  HUMAN_DECISION_COMPLETED: "green",
  PLANNING: "dark",
  PRODUCTION: "dark",
  FINAL_REVIEW: "amber",
  APPROVED: "green",
  REJECTED: "red",
  REVISION_REQUIRED: "amber",
};
