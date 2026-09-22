import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { checkAiHealth } from "@/lib/ai/provider";
import { AiTestPanel } from "@/components/AiTestPanel";
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
  const healthy = await checkAiHealth();

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
    <div className="flex h-screen overflow-hidden">
      {/* 左侧边栏：纵向步骤条 */}
      <aside className="w-48 shrink-0 overflow-y-auto border-r border-border bg-card p-3">
        <div className="mb-2 px-3 text-xs font-medium text-ink-soft">流程</div>
        <WorkflowStepper current={status} aiHealthy={healthy} />
      </aside>

      {/* 右侧主体 */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* 矮顶栏 */}
        <header className="flex shrink-0 items-center gap-3 border-b border-border bg-card px-4 py-2.5">
          <Link
            href="/"
            className="shrink-0 text-sm text-ink-soft hover:text-ink"
          >
            ← 返回
          </Link>
          <h1 className="min-w-0 flex-1 truncate font-serif text-base font-bold text-ink">
            {project.projectName}
          </h1>
          <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={`/projects/${project.id}/edit`}
              className="rounded-lg border border-border px-3 py-1.5 text-sm font-medium text-ink hover:bg-paper-2"
            >
              编辑
            </Link>
            <DeleteProjectButton id={project.id} />
          </div>
        </header>

        {/* 主体滚动 */}
        <div className="flex-1 min-h-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-3xl px-6 py-6">
            <NextActionBar action={nextAction} />

            <section id="ai-connect" className="mt-8">
              <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">
                AI 连接
              </h2>
              <AiTestPanel
                initialStatus={healthy ? "CONNECTED" : "DISCONNECTED"}
              />
            </section>

            <section className="mt-8">
              <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">
                项目详情
              </h2>
              <dl className="mt-3 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
                <Row label="主办机构" value={project.organization} />
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

            <div className="max-h-[70vh] overflow-y-auto">
              <DetailedPlanPanel
                id="panel-plan"
                projectId={project.id}
                decisionCompleted={decisionCompleted}
                selectedVariant={latestDecision?.selectedConcept ?? null}
                latestPlan={toPlanData(latestPlan)}
              />
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <BudgetPanel
                id="panel-budget"
                projectId={project.id}
                latestBudget={toBudgetData(latestBudget)}
              />
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <CopyPanel
                projectId={project.id}
                latestCopy={toContentData(latestCopy)}
              />
            </div>

            <div className="max-h-[70vh] overflow-y-auto">
              <PosterImagePanel
                projectId={project.id}
                posterContent={toContentData(latestPoster)?.content ?? null}
                images={posterImages.map(toPosterImageData)}
              />
            </div>

            <section id="approve" className="mt-8">
              <Link
                href={`/projects/${project.id}/approve`}
                className="block rounded-xl bg-gold px-5 py-3.5 text-center font-serif text-base font-semibold text-paper transition-colors hover:bg-ink"
              >
                进入最终审批 →
              </Link>
            </section>
          </div>
        </div>
      </div>
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
