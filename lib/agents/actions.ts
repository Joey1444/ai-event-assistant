"use server";

import { prisma } from "@/lib/db";
import { classifyError, generateImage } from "@/lib/ai/provider";
import {
  approvalDecisionSchema,
  budgetItemsSchema,
  contentSchema,
  editInstructionSchema,
} from "@/lib/validation";
import {
  parseBlockers,
  toApprovalData,
  toBudgetData,
  toContentData,
  toDecisionData,
  toFinalQaData,
  toPlanData,
  toPosterImageData,
} from "@/lib/serializers";
import { runPmAnalysis } from "./pm";
import { runStrategist } from "./strategist";
import { runCritic } from "./critic";
import { runFactChecker } from "./factChecker";
import { runPlanner } from "./planner";
import { runBudget } from "./budget";
import { runCopywriter } from "./copywriter";
import { runPoster } from "./poster";
import { runPosterDesigner } from "./posterDesigner";
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
  FactCheckResult,
  FinalQaResult,
  GenerateBudgetResult,
  GenerateConceptsResult,
  GeneratePlanResult,
  PlanData,
  PosterImageResult,
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
    await prisma.$transaction([
      prisma.pmAnalysis.deleteMany({ where: { projectId } }),
      prisma.pmAnalysis.create({
        data: {
          projectId,
          summary: analysis.summary,
          blockers: JSON.stringify(analysis.blockers),
          minorGaps: JSON.stringify(analysis.minorGaps),
          assumptions: JSON.stringify(analysis.assumptions),
          nextStep: analysis.nextStep,
          canStart: analysis.canStart,
        },
      }),
      prisma.project.update({
        where: { id: projectId },
        data: { status: "PM_ANALYSIS" },
      }),
    ]);
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

    if (result.items.length === 0 && result.facts.length === 0) {
      return { ok: false, error: "未从检索结果中提取到有效资料，请稍后重试" };
    }

    await prisma.$transaction([
      prisma.researchItem.deleteMany({ where: { projectId } }),
      prisma.fact.deleteMany({ where: { projectId } }),
      prisma.researchItem.createMany({
        data: result.items.map((item) => ({
          projectId,
          title: item.title,
          content: item.content,
          source: item.source || null,
          sourceUrl: item.sourceUrl || null,
        })),
      }),
      prisma.fact.createMany({
        data: result.facts.map((f) => ({
          projectId,
          claim: f.claim,
          evidence: f.evidence || null,
          source: f.source || null,
          sourceUrl: f.sourceUrl || null,
          confidence: f.confidence || null,
          status: f.status,
          reason: f.reason || null,
          requiresHumanVerification: f.requiresHumanVerification,
        })),
      }),
    ]);

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

    await prisma.$transaction([
      prisma.concept.deleteMany({ where: { projectId } }),
      prisma.concept.createMany({
        data: concepts.map((c) => ({
          projectId,
          variant: c.variant,
          direction: c.direction,
          content: JSON.stringify(c),
        })),
      }),
    ]);
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

    await prisma.$transaction([
      prisma.critique.deleteMany({ where: { projectId } }),
      prisma.critique.create({
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
      }),
    ]);
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

    await prisma.$transaction([
      prisma.fact.deleteMany({ where: { projectId } }),
      prisma.fact.createMany({
        data: facts.map((f) => ({
          projectId,
          claim: f.claim,
          evidence: f.evidence,
          source: f.source,
          sourceUrl: f.sourceUrl,
          confidence: f.confidence,
          status: f.status,
          reason: f.reason,
          requiresHumanVerification: f.requiresHumanVerification,
        })),
      }),
    ]);
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
  const parsed = contentSchema.safeParse(content);
  if (!parsed.success) {
    return { ok: false, error: "方案内容格式不正确" };
  }

  const version = await nextPlanVersion(projectId);
  const plan = await prisma.activityPlan.create({
    data: {
      projectId,
      version,
      content: JSON.stringify(parsed.data),
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
  const parsed = budgetItemsSchema.safeParse(items);
  if (!parsed.success) {
    return { ok: false, error: "预算数据格式不正确，请检查数量和单价是否为有效数字" };
  }

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
      total: parsed.data.reduce((s, i) => s + i.quantity * i.unitPrice, 0),
      createdByAgent: "user",
      items: { create: parsed.data },
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
  const parsed = contentSchema.safeParse(content);
  if (!parsed.success) {
    return { ok: false, error: "文案内容格式不正确" };
  }

  const version = await nextContentVersion(projectId, "copy");
  const copy = await prisma.copy.create({
    data: {
      projectId,
      version,
      content: JSON.stringify(parsed.data),
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
  const parsed = contentSchema.safeParse(content);
  if (!parsed.success) {
    return { ok: false, error: "海报内容格式不正确" };
  }

  const version = await nextContentVersion(projectId, "poster");
  const poster = await prisma.poster.create({
    data: {
      projectId,
      version,
      content: JSON.stringify(parsed.data),
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

export async function generatePosterImage(
  projectId: string,
): Promise<PosterImageResult> {
  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      plans: { orderBy: { version: "desc" } },
      posters: { orderBy: { version: "desc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  const plan = project.plans[0];
  if (!plan) return { ok: false, error: "还没有详细活动方案，请先生成详细方案。" };
  const poster = project.posters[0];
  if (!poster) return { ok: false, error: "还没有海报内容，请先生成海报。" };

  try {
    const designed = await runPosterDesigner({
      posterText: formatContentForQa(poster.content),
      briefText: formatBrief(project),
    });
    const image = await generateImage({
      prompt: designed.imagePrompt,
      size: designed.size,
    });

    const version = await nextPosterImageVersion(projectId);
    await prisma.posterImage.create({
      data: {
        projectId,
        version,
        imageDataUrl: image.dataUrl,
        prompt: designed.imagePrompt,
        editInstruction: null,
        parentVersion: null,
        createdByAgent: "poster-designer-agent",
      },
    });

    return { ok: true, images: await listPosterImages(projectId) };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export async function editPosterImage(
  projectId: string,
  instruction: string,
  sourceImageId?: string,
): Promise<PosterImageResult> {
  const parsed = editInstructionSchema.safeParse(instruction);
  if (!parsed.success) {
    return { ok: false, error: "修改指令不能为空，且不超过 2000 字" };
  }

  const project = await prisma.project.findUnique({
    where: { id: projectId },
    include: {
      brief: true,
      plans: { orderBy: { version: "desc" } },
      posters: { orderBy: { version: "desc" } },
    },
  });
  if (!project) return { ok: false, error: "项目不存在" };
  const plan = project.plans[0];
  if (!plan) return { ok: false, error: "还没有详细活动方案，请先生成详细方案。" };
  const poster = project.posters[0];
  if (!poster) return { ok: false, error: "还没有海报内容，请先生成海报。" };

  const source = sourceImageId
    ? await prisma.posterImage.findFirst({
        where: { id: sourceImageId, projectId },
      })
    : await prisma.posterImage.findFirst({
        where: { projectId },
        orderBy: { version: "desc" },
      });
  if (!source) return { ok: false, error: "还没有海报图片，请先生成第一张海报。" };

  try {
    const designed = await runPosterDesigner({
      posterText: formatContentForQa(poster.content),
      briefText: formatBrief(project),
      prevPrompt: source.prompt,
      editInstruction: parsed.data,
    });
    const image = await generateImage({
      prompt: designed.imagePrompt,
      initImage: source.imageDataUrl,
      size: designed.size,
    });

    const version = await nextPosterImageVersion(projectId);
    await prisma.posterImage.create({
      data: {
        projectId,
        version,
        imageDataUrl: image.dataUrl,
        prompt: designed.imagePrompt,
        editInstruction: parsed.data,
        parentVersion: source.version,
        createdByAgent: "poster-designer-agent",
      },
    });

    return { ok: true, images: await listPosterImages(projectId) };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

async function nextPosterImageVersion(projectId: string): Promise<number> {
  const latest = await prisma.posterImage.findFirst({
    where: { projectId },
    orderBy: { version: "desc" },
  });
  return (latest?.version ?? 0) + 1;
}

async function listPosterImages(projectId: string) {
  const rows = await prisma.posterImage.findMany({
    where: { projectId },
    orderBy: { version: "asc" },
  });
  return rows.map(toPosterImageData);
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

  const decisionOk = approvalDecisionSchema.safeParse(decision);
  if (!decisionOk.success) return { ok: false, error: "无效的审批决策" };

  const approval = await prisma.approval.create({
    data: {
      projectId,
      decision: decisionOk.data,
      approvedBy: "user",
      approvalNote: note ?? null,
    },
  });
  await prisma.project.update({
    where: { id: projectId },
    data: { status: decisionOk.data },
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
