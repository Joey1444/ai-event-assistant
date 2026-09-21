import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { DeleteProjectButton } from "@/components/projects/DeleteProjectButton";
import { WorkflowStepper } from "@/components/projects/WorkflowStepper";
import { NextActionBar } from "@/components/projects/NextActionBar";
import { PmAnalysisPanel } from "@/components/agents/PmAnalysisPanel";
import { ResearcherPanel } from "@/components/agents/ResearcherPanel";
import { ConceptPanel } from "@/components/agents/ConceptPanel";
import { CriticPanel } from "@/components/agents/CriticPanel";
import { FactCheckPanel } from "@/components/agents/FactCheckPanel";
import { HumanDecisionGate } from "@/components/agents/HumanDecisionGate";
import { DetailedPlanPanel } from "@/components/agents/DetailedPlanPanel";
import { BudgetPanel } from "@/components/agents/BudgetPanel";
import { CopyPanel } from "@/components/agents/CopyPanel";
import { PosterPanel } from "@/components/agents/PosterPanel";
import { PosterImagePanel } from "@/components/agents/PosterImagePanel";
import {
  toAnalysisData,
  toBudgetData,
  toConceptData,
  toContentData,
  toCritiqueData,
  toDecisionData,
  toFactData,
  toPlanData,
  toPosterImageData,
} from "@/lib/serializers";
import {
  STATUS_LABELS,
  STATUS_TONES,
  type ProjectStatus,
} from "@/lib/status";
import { getNextAction } from "@/lib/workflow";

export const dynamic = "force-dynamic";

export default async function ProjectDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const project = await prisma.project.findUnique({
    where: { id },
    include: { brief: true },
  });
  if (!project) notFound();

  const latestAnalysis = await prisma.pmAnalysis.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });
  const concepts = await prisma.concept.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });
  const latestCritique = await prisma.critique.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });
  const facts = await prisma.fact.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });
  const researchItems = await prisma.researchItem.findMany({
    where: { projectId: project.id },
    orderBy: { createdAt: "asc" },
  });
  const latestDecision = await prisma.decision.findFirst({
    where: { projectId: project.id },
    orderBy: { createdAt: "desc" },
  });
  const latestPlan = await prisma.activityPlan.findFirst({
    where: { projectId: project.id },
    orderBy: { version: "desc" },
  });
  const latestBudget = await prisma.budget.findFirst({
    where: { projectId: project.id },
    orderBy: { version: "desc" },
    include: { items: true },
  });
  const latestCopy = await prisma.copy.findFirst({
    where: { projectId: project.id },
    orderBy: { version: "desc" },
  });
  const latestPoster = await prisma.poster.findFirst({
    where: { projectId: project.id },
    orderBy: { version: "desc" },
  });
  const posterImages = await prisma.posterImage.findMany({
    where: { projectId: project.id },
    orderBy: { version: "asc" },
  });
  const latestFinalQa = await prisma.finalQa.findFirst({
    where: { projectId: project.id },
    orderBy: { version: "desc" },
  });
  const latestApproval = await prisma.approval.findFirst({
    where: { projectId: project.id },
    orderBy: { approvedAt: "desc" },
  });

  const status = project.status as ProjectStatus;
  const decisionCompleted = !!latestDecision && !latestDecision.rejected;

  const nextAction = getNextAction({
    id: project.id,
    pmAnalyses: latestAnalysis ? [latestAnalysis] : [],
    researchItems,
    concepts,
    critiques: latestCritique ? [latestCritique] : [],
    decisions: latestDecision && !latestDecision.rejected ? [latestDecision] : [],
    plans: latestPlan ? [latestPlan] : [],
    budgets: latestBudget ? [latestBudget] : [],
    copies: latestCopy ? [latestCopy] : [],
    posters: latestPoster ? [latestPoster] : [],
    finalQas: latestFinalQa ? [latestFinalQa] : [],
    approvals: latestApproval ? [latestApproval] : [],
  });

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm text-ink-soft hover:text-ink">
        ← 返回项目列表
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-bold text-ink">
          {project.projectName}
        </h1>
        <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
      </div>
      <p className="mt-1 text-ink-soft">{project.organization}</p>

      <NextActionBar action={nextAction} />

      <div className="mt-4 rounded-xl border border-border bg-card px-4 py-3">
        <WorkflowStepper current={project.status} />
      </div>

      <div className="mt-6 flex gap-3">
        <Link
          href={`/projects/${project.id}/edit`}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-gold"
        >
          编辑
        </Link>
        <DeleteProjectButton id={project.id} />
      </div>

      <section className="mt-8">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">
          项目详情
        </h2>
        <dl className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          <Row label="活动类型" value={project.brief?.eventType} />
          <Row label="活动日期" value={project.brief?.eventDate} />
          <Row label="预计人数" value={project.brief?.expectedParticipants} />
          <Row label="预算" value={project.brief?.budget} />
          <Row label="活动地点" value={project.brief?.location} />
          <Row label="目标人群" value={project.brief?.targetAudience} />
          <Row label="活动目的" value={project.brief?.objective} />
          <Row label="已知要求" value={project.brief?.requirements} />
          <Row label="其他备注" value={project.brief?.notes} />
        </dl>
      </section>

      <PmAnalysisPanel
        id="panel-pm"
        projectId={project.id}
        savedAnalysis={toAnalysisData(latestAnalysis)}
      />

      <ResearcherPanel
        id="panel-research"
        projectId={project.id}
        savedItems={researchItems.map((r) => ({
          title: r.title,
          content: r.content,
          source: r.source ?? "",
          sourceUrl: r.sourceUrl ?? "",
        }))}
        savedFacts={facts.map(toFactData)}
      />

      <ConceptPanel
        id="panel-concept"
        projectId={project.id}
        savedConcepts={concepts.map(toConceptData)}
      />

      <CriticPanel
        id="panel-critic"
        projectId={project.id}
        savedCritique={toCritiqueData(latestCritique)}
      />

      <FactCheckPanel
        projectId={project.id}
        savedFacts={facts.map(toFactData)}
      />

      <HumanDecisionGate
        id="panel-decision"
        projectId={project.id}
        concepts={concepts.map(toConceptData)}
        critic={toCritiqueData(latestCritique)}
        facts={facts.map(toFactData)}
        decision={toDecisionData(latestDecision)}
      />

      <DetailedPlanPanel
        id="panel-plan"
        projectId={project.id}
        decisionCompleted={decisionCompleted}
        selectedVariant={latestDecision?.selectedConcept ?? null}
        latestPlan={toPlanData(latestPlan)}
      />

      <BudgetPanel
        id="panel-budget"
        projectId={project.id}
        latestBudget={toBudgetData(latestBudget)}
      />

      <CopyPanel
        projectId={project.id}
        latestCopy={toContentData(latestCopy)}
      />

      <PosterPanel
        projectId={project.id}
        latestPoster={toContentData(latestPoster)}
      />

      <PosterImagePanel
        projectId={project.id}
        images={posterImages.map(toPosterImageData)}
      />

      <section className="mt-8">
        <Link
          href={`/projects/${project.id}/approve`}
          className="block rounded-xl bg-gold px-5 py-3.5 text-center font-serif text-base font-semibold text-paper transition-colors hover:bg-ink"
        >
          进入最终审批 →
        </Link>
      </section>
    </div>
  );
}

function Row({ label, value }: { label: string; value?: string | null }) {
  return (
    <div className="flex px-4 py-3">
      <dt className="w-28 shrink-0 text-sm text-ink-soft">{label}</dt>
      <dd className="whitespace-pre-wrap text-sm text-ink">
        {value || "—"}
      </dd>
    </div>
  );
}
