// 共享序列化助手：把 Prisma 查询结果（原始行）转成前端可用的数据对象。
// 页面/组件一律从这里 import，避免在多个地方重复定义。
import type {
  ActivityPlanData,
  ApprovalData,
  BudgetData,
  ConceptData,
  CritiqueData,
  DecisionData,
  DesignData,
  FactData,
  FinalQaRecord,
  PmAnalysisData,
  QaFinding,
  VersionedContentData,
} from "@/lib/agents/types";

export function parseArr(s: string | null): string[] {
  if (!s) return [];
  try {
    const v = JSON.parse(s);
    return Array.isArray(v) ? v.map(String) : [];
  } catch {
    return [];
  }
}

export function parseFindings(s: string): QaFinding[] {
  try {
    const v = JSON.parse(s);
    return Array.isArray(v)
      ? v.map((x) => ({
          check: String(x?.check ?? ""),
          status: String(x?.status ?? "pass"),
          detail: String(x?.detail ?? ""),
        }))
      : [];
  } catch {
    return [];
  }
}

export function toAnalysisData(row: {
  summary: string;
  knownFacts: string;
  missingInformation: string;
  assumptions: string;
  nextStep: string;
  requiresHumanInput: boolean;
} | null): PmAnalysisData | null {
  if (!row) return null;
  return {
    summary: row.summary,
    knownFacts: parseArr(row.knownFacts),
    missingInformation: parseArr(row.missingInformation),
    assumptions: parseArr(row.assumptions),
    nextStep: row.nextStep,
    requiresHumanInput: row.requiresHumanInput,
  };
}

export function toConceptData(row: {
  variant: string;
  direction: string;
  content: string;
}): ConceptData {
  const d = JSON.parse(row.content) as ConceptData;
  return { ...d, variant: row.variant, direction: row.direction };
}

export function toCritiqueData(row: {
  scores: string;
  strengths: string;
  weaknesses: string;
  risks: string;
  criticalIssues: string;
  recommendation: string;
  recommendedConcept: string;
} | null): CritiqueData | null {
  if (!row) return null;
  return {
    scores: JSON.parse(row.scores),
    strengths: parseArr(row.strengths),
    weaknesses: parseArr(row.weaknesses),
    risks: parseArr(row.risks),
    criticalIssues: parseArr(row.criticalIssues),
    recommendation: row.recommendation,
    recommendedConcept: row.recommendedConcept,
  };
}

export function toFactData(row: {
  claim: string;
  evidence: string | null;
  source: string | null;
  sourceUrl: string | null;
  confidence: string | null;
  status: string;
  reason: string | null;
  requiresHumanVerification: boolean;
}): FactData {
  return {
    claim: row.claim,
    evidence: row.evidence ?? "",
    source: row.source ?? "",
    sourceUrl: row.sourceUrl ?? "",
    confidence: row.confidence ?? "",
    status: row.status,
    reason: row.reason ?? "",
    requiresHumanVerification: row.requiresHumanVerification,
  };
}

export function toDecisionData(row: {
  selectedConcept: string | null;
  rejected: boolean;
  selectedBy: string;
  decisionNote: string | null;
  createdAt: Date;
} | null): DecisionData | null {
  if (!row) return null;
  return {
    selectedConcept: row.selectedConcept,
    rejected: row.rejected,
    selectedBy: row.selectedBy,
    decisionNote: row.decisionNote ?? "",
    createdAt: row.createdAt.toISOString(),
  };
}

export function toPlanData(row: {
  version: number;
  content: string;
  createdByAgent: string;
  createdAt: Date;
} | null): ActivityPlanData | null {
  if (!row) return null;
  return {
    version: row.version,
    content: JSON.parse(row.content),
    createdByAgent: row.createdByAgent,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toContentData(row: {
  version: number;
  content: string;
  createdByAgent: string;
  createdAt: Date;
} | null): VersionedContentData | null {
  if (!row) return null;
  return {
    version: row.version,
    content: JSON.parse(row.content),
    createdByAgent: row.createdByAgent,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toBudgetData(row: {
  version: number;
  currency: string;
  contingencyRate: number;
  summary: string | null;
  costRisks: string | null;
  createdByAgent: string;
  createdAt: Date;
  items: {
    category: string;
    item: string;
    quantity: number;
    unit: string;
    unitPrice: number;
    notes: string | null;
    source: string;
    confidence: string | null;
  }[];
} | null): BudgetData | null {
  if (!row) return null;
  return {
    version: row.version,
    currency: row.currency,
    contingencyRate: row.contingencyRate,
    summary: row.summary ?? "",
    costRisks: parseArr(row.costRisks),
    createdByAgent: row.createdByAgent,
    createdAt: row.createdAt.toISOString(),
    items: row.items.map((i) => ({
      category: i.category,
      item: i.item,
      quantity: i.quantity,
      unit: i.unit,
      unitPrice: i.unitPrice,
      notes: i.notes ?? "",
      source: i.source,
      confidence: i.confidence ?? "",
    })),
  };
}

export function toDesignData(row: {
  version: number;
  html: string;
  createdByAgent: string;
  createdAt: Date;
} | null): DesignData | null {
  if (!row) return null;
  return {
    version: row.version,
    html: row.html,
    createdByAgent: row.createdByAgent,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toFinalQaData(row: {
  version: number;
  result: string;
  summary: string;
  findings: string;
  createdByAgent: string;
  createdAt: Date;
} | null): FinalQaRecord | null {
  if (!row) return null;
  return {
    version: row.version,
    result: row.result,
    summary: row.summary,
    findings: parseFindings(row.findings),
    createdByAgent: row.createdByAgent,
    createdAt: row.createdAt.toISOString(),
  };
}

export function toApprovalData(row: {
  decision: string;
  approvedBy: string;
  approvalNote: string | null;
  approvedAt: Date;
} | null): ApprovalData | null {
  if (!row) return null;
  return {
    decision: row.decision,
    approvedBy: row.approvedBy,
    approvalNote: row.approvalNote ?? "",
    approvedAt: row.approvedAt.toISOString(),
  };
}
