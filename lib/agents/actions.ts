"use server";

import { prisma } from "@/lib/db";
import { classifyError } from "@/lib/ai/provider";
import {
  parseBlockers,
  toApprovalData,
  toBudgetData,
  toContentData,
  toDecisionData,
  toDesignData,
  toFinalQaData,
  toPlanData,
} from "@/lib/serializers";
import { runPmAnalysis } from "./pm";
import { runStrategist } from "./strategist";
import { runCritic } from "./critic";
import { runFactChecker } from "./factChecker";
import { runPlanner } from "./planner";
import { runBudget } from "./budget";
import { runCopywriter } from "./copywriter";
import { runPoster } from "./poster";
import { runDesigner } from "./designer";
import { runQa } from "./qa";
import { runResearcher, type ResearchResult } from "./researcher";
import {
  formatBrief,
  formatBudgetForQa,
  formatConceptText,
  formatConceptsText,
  formatContentForQa,
  formatFacts,
  formatPlanText,
  formatResearch,
} from "./format";
import type {
  AnalyzeResult,
  ApprovalResult,
  BudgetItemData,
  ContentResult,
  CritiqueResult,
  DecisionResult,
  DesignResult,
  FactCheckResult,
  FinalQaResult,
  GenerateBudgetResult,
  GenerateConceptsResult,
  GeneratePlanResult,
  PlanData,
  SaveBudgetResult,
  SavePlanVersionResult,
} from "./types";

export async function analyzeProject(projectId: string): Promise<AnalyzeResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { brief: true },
  });
  if (!project) return { ok: false, error: "项目不存在" };

  try {
    const analysis = await runPmAnalysis(formatBrief(project));
    await prisma.pmAnalysis.deleteMany({ where: { projectId } });
    await prisma.pmAnalysis.create({
      data: {
        projectId,
        summary: analysis.summary,
        blockers: JSON.stringify(analysis.blockers),
        minorGaps: JSON.stringify(analysis.minorGaps),
        assumptions: JSON.stringify(analysis.assumptions),
        nextStep: analysis.nextStep,
        canStart: analysis.canStart,
      },
    });
    return { ok: true, analysis };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function researchProject(
  projectId: string,
): Promise<({ ok: true } & ResearchResult) | { ok: false; error: string }> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { brief: true },
  });
  if (!project) return { ok: false, error: "项目不存在" };

  const brief = project.brief;
  const queries: string[] = [];
  if (project.organization) queries.push(project.organization);
  if (project.organization && brief?.location) {
    queries.push(`${project.organization} ${brief.location}`);
    queries.push(`${brief.location} 场地 容纳人数`);
  }
  if (brief?.eventType) queries.push(`${brief.eventType} 活动 策划`);

  try {
    const result = await runResearcher({
      briefText: formatBrief(project),
      queries: queries.slice(0, 4),
    });

    await prisma.researchItem.deleteMany({ where: { projectId } });
    for (const item of result.items) {
      await prisma.researchItem.create({
        data: {
          projectId,
          title: item.title,
          content: item.content,
          source: item.source || null,
          sourceUrl: item.sourceUrl || null,
        },
      });
    }

    await prisma.fact.deleteMany({ where: { projectId } });
    for (const f of result.facts) {
      await prisma.fact.create({
        data: {
          projectId,
          claim: f.claim,
          evidence: f.evidence || null,
          source: f.source || null,
          sourceUrl: f.sourceUrl || null,
          confidence: f.confidence || null,
          status: f.status,
          reason: f.reason || null,
          requiresHumanVerification: f.requiresHumanVerification,
        },
      });
    }

    return { ok: true, ...result };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function generateConcepts(
  projectId: string,
): Promise<GenerateConceptsResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { brief: true, researchItems: true, facts: true },
  });
  if (!project) return { ok: false, error: "项目不存在" };

  const latestAnalysis = await prisma.pmAnalysis.findFirst({
    where: { projectId },
    orderBy: { createdAt: "desc" },
  });
  if (latestAnalysis && !latestAnalysis.canStart) {
    const items = parseBlockers(latestAnalysis.blockers)
      .map((b) => b.item)
      .slice(0, 3)
      .join("、");
    return {
      ok: false,
      error: `信息还不完整，请先补充：${items || "日期/地点/预算等关键信息"}`,
    };
  }

  try {
    const concepts = await runStrategist({
      briefText: formatBrief(project),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
    });

    await prisma.concept.deleteMany({ where: { projectId } });
    for (const c of concepts) {
      await prisma.concept.create({
        data: {
          projectId,
          variant: c.variant,
          direction: c.direction,
          content: JSON.stringify(c),
        },
      });
    }
    return { ok: true, concepts };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function runCritique(projectId: string): Promise<CritiqueResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      researchItems: true,
      facts: true,
      concepts: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  if (project.concepts.length === 0) {
    return { ok: false, error: "还没有生成方案，请先运行「活动方案」生成方案。" };
  }

  try {
    const critique = await runCritic({
      briefText: formatBrief(project),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
      conceptsText: formatConceptsText(project.concepts),
    });

    await prisma.critique.deleteMany({ where: { projectId } });
    await prisma.critique.create({
      data: {
        projectId,
        scores: JSON.stringify(critique.scores),
        strengths: JSON.stringify(critique.strengths),
        weaknesses: JSON.stringify(critique.weaknesses),
        risks: JSON.stringify(critique.risks),
        criticalIssues: JSON.stringify(critique.criticalIssues),
        recommendation: critique.recommendation,
        recommendedConcept: critique.recommendedConcept,
      },
    });
    return { ok: true, critique };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function factCheckProject(
  projectId: string,
): Promise<FactCheckResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      researchItems: true,
      facts: true,
      concepts: { orderBy: { createdAt: "asc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  if (project.concepts.length === 0) {
    return { ok: false, error: "还没有生成方案，请先运行「活动方案」生成方案。" };
  }

  try {
    const facts = await runFactChecker({
      briefText: formatBrief(project),
      conceptsText: formatConceptsText(project.concepts),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
    });

    await prisma.fact.deleteMany({ where: { projectId } });
    for (const f of facts) {
      await prisma.fact.create({
        data: {
          projectId,
          claim: f.claim,
          evidence: f.evidence,
          source: f.source,
          sourceUrl: f.sourceUrl,
          confidence: f.confidence,
          status: f.status,
          reason: f.reason,
          requiresHumanVerification: f.requiresHumanVerification,
        },
      });
    }
    return { ok: true, facts };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function selectConcept(
  projectId: string,
  variant: string,
  note?: string,
): Promise<DecisionResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: { concepts: true },
  });
  if (!project) return { ok: false, error: "项目不存在" };

  const exists = project.concepts.some((c) => c.variant === variant);
  if (!exists) {
    return {
      ok: false,
      error: "所选方案不存在，请先运行「活动方案」生成方案。",
    };
  }

  const decision = await prisma.decision.create({
    data: {
      projectId,
      selectedConcept: variant,
      rejected: false,
      selectedBy: "user",
      decisionNote: note ?? null,
    },
  });

  await prisma.project.update({
    where: { id: projectId },
    data: { status: "HUMAN_DECISION_COMPLETED" },
  });

  return { ok: true, decision: toDecisionData(decision)! };
}

export async function rejectAllConcepts(
  projectId: string,
  note?: string,
): Promise<DecisionResult> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, error: "项目不存在" };

  const decision = await prisma.decision.create({
    data: {
      projectId,
      selectedConcept: null,
      rejected: true,
      selectedBy: "user",
      decisionNote: note ?? null,
    },
  });

  return { ok: true, decision: toDecisionData(decision)! };
}

export async function generatePlan(
  projectId: string,
): Promise<GeneratePlanResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      researchItems: true,
      facts: true,
      concepts: true,
      decisions: { orderBy: { createdAt: "desc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };

  const selectedVariant = project.decisions[0]?.selectedConcept;
  if (!selectedVariant) {
    return { ok: false, error: "还没有选择活动方向，请先在「请选择活动方向」选择方案。" };
  }

  const selected = project.concepts.find((c) => c.variant === selectedVariant);
  if (!selected) return { ok: false, error: "找不到所选方案，请重新生成方案。" };

  try {
    const content = await runPlanner({
      selectedConceptText: formatConceptText(selected),
      briefText: formatBrief(project),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
    });

    const version = await nextPlanVersion(projectId);
    const plan = await prisma.activityPlan.create({
      data: {
        projectId,
        version,
        content: JSON.stringify(content),
        createdByAgent: "detailed-planning-agent",
      },
    });

    return { ok: true, plan: toPlanData(plan)! };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function savePlanVersion(
  projectId: string,
  content: PlanData,
): Promise<SavePlanVersionResult> {
  const version = await nextPlanVersion(projectId);
  const plan = await prisma.activityPlan.create({
    data: {
      projectId,
      version,
      content: JSON.stringify(content),
      createdByAgent: "user",
    },
  });
  return { ok: true, plan: toPlanData(plan)! };
}

async function nextPlanVersion(projectId: string): Promise<number> {
  const latest = await prisma.activityPlan.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  return (latest?.version ?? 0) + 1;
}

export async function generateBudget(
  projectId: string,
): Promise<GenerateBudgetResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      researchItems: true,
      facts: true,
      plans: { orderBy: { version: "desc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  const plan = project.plans[0];
  if (!plan) return { ok: false, error: "还没有详细活动方案，请先生成详细方案。" };

  try {
    const result = await runBudget({
      planText: formatPlanText(plan),
      briefText: formatBrief(project),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
    });

    const version = await nextBudgetVersion(projectId);
    const budget = await prisma.budget.create({
      data: {
        projectId,
        version,
        summary: result.summary,
        costRisks: JSON.stringify(result.costRisks),
        currency: result.currency,
        contingencyRate: result.contingencyRate,
        total: result.total,
        createdByAgent: "budget-agent",
        items: { create: result.items },
      },
      include: { items: true },
    });

    return { ok: true, budget: toBudgetData(budget)! };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function saveBudgetVersion(
  projectId: string,
  items: BudgetItemData[],
): Promise<SaveBudgetResult> {
  const latest = await prisma.budget.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });

  const version = await nextBudgetVersion(projectId);
  const budget = await prisma.budget.create({
    data: {
      projectId,
      version,
      summary: latest?.summary ?? "",
      costRisks: latest?.costRisks ?? "[]",
      currency: latest?.currency ?? "KES",
      contingencyRate: latest?.contingencyRate ?? 0.1,
      total: items.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      createdByAgent: "user",
      items: { create: items },
    },
    include: { items: true },
  });

  return { ok: true, budget: toBudgetData(budget)! };
}

async function nextBudgetVersion(projectId: string): Promise<number> {
  const latest = await prisma.budget.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  return (latest?.version ?? 0) + 1;
}

export async function generateCopy(projectId: string): Promise<ContentResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      researchItems: true,
      facts: true,
      plans: { orderBy: { version: "desc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  const plan = project.plans[0];
  if (!plan) return { ok: false, error: "还没有详细活动方案，请先生成详细方案。" };

  try {
    const content = await runCopywriter({
      planText: formatPlanText(plan),
      briefText: formatBrief(project),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
    });

    const version = await nextContentVersion(projectId, "copy");
    const copy = await prisma.copy.create({
      data: {
        projectId,
        version,
        content: JSON.stringify(content),
        createdByAgent: "copywriter-agent",
      },
    });
    return { ok: true, data: toContentData(copy)! };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function saveCopyVersion(
  projectId: string,
  content: Record<string, string>,
): Promise<ContentResult> {
  const version = await nextContentVersion(projectId, "copy");
  const copy = await prisma.copy.create({
    data: {
      projectId,
      version,
      content: JSON.stringify(content),
      createdByAgent: "user",
    },
  });
  return { ok: true, data: toContentData(copy)! };
}

export async function generatePoster(projectId: string): Promise<ContentResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      researchItems: true,
      facts: true,
      plans: { orderBy: { version: "desc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  const plan = project.plans[0];
  if (!plan) return { ok: false, error: "还没有详细活动方案，请先生成详细方案。" };

  try {
    const content = await runPoster({
      planText: formatPlanText(plan),
      briefText: formatBrief(project),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
    });

    const version = await nextContentVersion(projectId, "poster");
    const poster = await prisma.poster.create({
      data: {
        projectId,
        version,
        content: JSON.stringify(content),
        createdByAgent: "poster-agent",
      },
    });
    return { ok: true, data: toContentData(poster)! };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function savePosterVersion(
  projectId: string,
  content: Record<string, string>,
): Promise<ContentResult> {
  const version = await nextContentVersion(projectId, "poster");
  const poster = await prisma.poster.create({
    data: {
      projectId,
      version,
      content: JSON.stringify(content),
      createdByAgent: "user",
    },
  });
  return { ok: true, data: toContentData(poster)! };
}

async function nextContentVersion(
  projectId: string,
  kind: "copy" | "poster",
): Promise<number> {
  const latest =
    kind === "copy"
      ? await prisma.copy.findFirst({
          where: { projectId },
          orderBy: { version: "desc" },
        })
      : await prisma.poster.findFirst({
          where: { projectId },
          orderBy: { version: "desc" },
        });
  return (latest?.version ?? 0) + 1;
}

export async function generateDesign(projectId: string): Promise<DesignResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      researchItems: true,
      facts: true,
      plans: { orderBy: { version: "desc" } },
      posters: { orderBy: { version: "desc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  const plan = project.plans[0];
  if (!plan) return { ok: false, error: "还没有详细活动方案，请先生成详细方案。" };

  try {
    const html = await runDesigner({
      planText: formatPlanText(plan),
      briefText: formatBrief(project),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
      posterText: project.posters[0]
        ? formatContentForQa(project.posters[0].content)
        : "（无海报内容）",
    });

    const version = await nextDesignVersion(projectId);
    const design = await prisma.posterDesign.create({
      data: {
        projectId,
        version,
        html,
        createdByAgent: "designer-agent",
      },
    });
    return { ok: true, design: toDesignData(design)! };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function saveDesignVersion(
  projectId: string,
  html: string,
): Promise<DesignResult> {
  const version = await nextDesignVersion(projectId);
  const design = await prisma.posterDesign.create({
    data: {
      projectId,
      version,
      html,
      createdByAgent: "user",
    },
  });
  return { ok: true, design: toDesignData(design)! };
}

async function nextDesignVersion(projectId: string): Promise<number> {
  const latest = await prisma.posterDesign.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  return (latest?.version ?? 0) + 1;
}

export async function runFinalQa(projectId: string): Promise<FinalQaResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      researchItems: true,
      facts: true,
      concepts: true,
      decisions: { orderBy: { createdAt: "desc" } },
      plans: { orderBy: { version: "desc" } },
      budgets: { orderBy: { version: "desc" }, include: { items: true } },
      copies: { orderBy: { version: "desc" } },
      posters: { orderBy: { version: "desc" } },
      posterDesigns: { orderBy: { version: "desc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  const plan = project.plans[0];
  if (!plan) return { ok: false, error: "还没有详细活动方案，请先生成详细方案。" };

  const selectedVariant = project.decisions[0]?.selectedConcept;
  const concept = project.concepts.find((c) => c.variant === selectedVariant);

  try {
    const qa = await runQa({
      briefText: formatBrief(project),
      researchText: formatResearch(project.researchItems),
      factsText: formatFacts(project.facts),
      conceptText: concept ? formatConceptText(concept) : "（未选择方案）",
      planText: formatPlanText(plan),
      budgetText: project.budgets[0]
        ? formatBudgetForQa(project.budgets[0])
        : "（无预算）",
      copyText: project.copies[0]
        ? formatContentForQa(project.copies[0].content)
        : "（无文案）",
      posterText: project.posters[0]
        ? formatContentForQa(project.posters[0].content)
        : "（无海报）",
      htmlText: project.posterDesigns[0]?.html ?? "（无海报设计）",
    });

    const version = await nextFinalQaVersion(projectId);
    const record = await prisma.finalQa.create({
      data: {
        projectId,
        version,
        result: qa.result,
        summary: qa.summary,
        findings: JSON.stringify(qa.findings),
        createdByAgent: "final-qa-agent",
      },
    });
    return { ok: true, qa: toFinalQaData(record)! };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function submitApproval(
  projectId: string,
  decision: "APPROVED" | "REJECTED" | "REVISION_REQUIRED",
  note?: string,
): Promise<ApprovalResult> {
  const project = await prisma.project.findUnique({ where: { id: projectId } });
  if (!project) return { ok: false, error: "项目不存在" };

  const approval = await prisma.approval.create({
    data: {
      projectId,
      decision,
      approvedBy: "user",
      approvalNote: note ?? null,
    },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { status: decision },
  });

  return { ok: true, approval: toApprovalData(approval)! };
}

async function nextFinalQaVersion(projectId: string): Promise<number> {
  const latest = await prisma.finalQa.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  return (latest?.version ?? 0) + 1;
}
