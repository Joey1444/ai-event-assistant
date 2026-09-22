import Link from "next/link";
import { notFound } from "next/navigation";
import type { ReactNode } from "react";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { FinalQaPanel } from "@/components/agents/FinalQaPanel";
import { ApprovalPanel } from "@/components/agents/ApprovalPanel";
import {
  BUDGET_CATEGORY_LABELS,
  COPY_FIELD_LABELS,
  FACT_STATUS_LABELS,
  PLAN_SECTION_LABELS,
  POSTER_FIELD_LABELS,
  type BudgetData,
} from "@/lib/agents/types";
import { toApprovalData, toBudgetData, toConceptData, toContentData, toFinalQaData, toPlanData } from "@/lib/serializers";
import {
  STATUS_LABELS,
  STATUS_TONES,
  type ProjectStatus,
} from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function ApprovalPage({
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

  const concepts = await prisma.concept.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });
  const decision = await prisma.decision.findFirst({
    where: { projectId: id },
    orderBy: { createdAt: "desc" },
  });
  const plan = await prisma.activityPlan.findFirst({
    where: { projectId: id },
    orderBy: { version: "desc" },
  });
  const budget = await prisma.budget.findFirst({
    where: { projectId: id },
    orderBy: { version: "desc" },
    include: { items: true },
  });
  const copy = await prisma.copy.findFirst({
    where: { projectId: id },
    orderBy: { version: "desc" },
  });
  const poster = await prisma.poster.findFirst({
    where: { projectId: id },
    orderBy: { version: "desc" },
  });
  const facts = await prisma.fact.findMany({
    where: { projectId: id },
    orderBy: { createdAt: "asc" },
  });
  const qa = await prisma.finalQa.findFirst({
    where: { projectId: id },
    orderBy: { version: "desc" },
  });
  const approval = await prisma.approval.findFirst({
    where: { projectId: id },
    orderBy: { approvedAt: "desc" },
  });

  const status = project.status as ProjectStatus;
  const selectedConcept = concepts.find(
    (c) => c.variant === decision?.selectedConcept,
  );
  const selectedConceptName = selectedConcept
    ? toConceptData(selectedConcept).name
    : "";
  const planData = plan ? toPlanData(plan)?.content ?? null : null;
  const copyData = copy ? toContentData(copy)?.content ?? null : null;
  const posterData = poster ? toContentData(poster)?.content ?? null : null;
  const budgetData = toBudgetData(budget);

  return (
    <div className="mx-auto w-full max-w-3xl flex-1 px-6 py-10">
      <Link
        href={`/projects/${project.id}`}
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← 返回项目详情
      </Link>

      <div className="mt-4 flex flex-wrap items-center gap-3">
        <h1 className="font-serif text-3xl font-bold text-ink">
          最终人工审批
        </h1>
        <Badge tone={STATUS_TONES[status]}>{STATUS_LABELS[status]}</Badge>
      </div>
      <h2 className="mt-1 font-serif text-lg font-semibold text-ink">
        {project.projectName}
      </h2>
      <p className="mt-1 text-sm text-ink-soft">
        这是最终人工审批。小莫只做检查，最终批准只有你能决定。
      </p>

      <section className="mt-8">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">
          项目概览
        </h2>
        <div className="mt-3 rounded-xl border border-border bg-card px-4 py-3 text-sm text-ink">
          <div>主办机构：{project.organization}</div>
          <div>活动类型：{project.brief?.eventType || "—"}</div>
          <div>活动日期：{project.brief?.eventDate || "—"}</div>
          <div>活动地点：{project.brief?.location || "—"}</div>
          <div>预算：{project.brief?.budget || "—"}</div>
          {selectedConcept ? (
            <div className="mt-2 rounded-lg bg-paper-2 px-3 py-2">
              👤 人类决定：已选择方案 {selectedConcept.variant} ·{" "}
              {selectedConcept.direction}（{selectedConceptName}）
            </div>
          ) : (
            <div className="mt-2 rounded-lg bg-gold-soft px-3 py-2 text-gold">
              ⚠️ 尚未选择活动方向
            </div>
          )}
        </div>
      </section>

      <Module title="📋 最终活动方案（小莫建议）">
        {planData ? <FieldView data={planData} labels={PLAN_SECTION_LABELS} /> : <Empty />}
      </Module>

      <Module title="💰 预算（小莫建议）">
        {budgetData ? <BudgetView budget={budgetData} /> : <Empty />}
      </Module>

      <Module title="🗓 时间安排（小莫建议）">
        {planData ? (
          <div className="whitespace-pre-wrap text-sm text-ink">
            {planData.dayOfSchedule || planData.flow || "—"}
          </div>
        ) : (
          <Empty />
        )}
      </Module>

      <Module title="✍️ 宣传文案（小莫建议）">
        {copyData ? <FieldView data={copyData} labels={COPY_FIELD_LABELS} /> : <Empty />}
      </Module>

      <Module title="🎨 海报（小莫建议）">
        {posterData ? <FieldView data={posterData} labels={POSTER_FIELD_LABELS} /> : <Empty />}
      </Module>

      <Module title="✅ 事实核验">
        {facts.length > 0 ? <FactsView facts={facts} /> : <Empty />}
      </Module>

      <Module title="⚠️ 风险">
        <div className="space-y-3 text-sm">
          <div>
            <div className="text-xs font-medium text-ink-soft">方案风险管理</div>
            <div className="mt-1 whitespace-pre-wrap text-ink">
              {planData?.risk || "—"}
            </div>
          </div>
          {facts.filter((f) => f.status === "CONFLICT").length > 0 ? (
            <div>
              <div className="text-xs font-medium text-cinnabar">❌ 冲突信息</div>
              <ul className="mt-1 list-disc pl-5 text-ink">
                {facts
                  .filter((f) => f.status === "CONFLICT")
                  .map((f, i) => (
                    <li key={i}>{f.claim}</li>
                  ))}
              </ul>
            </div>
          ) : null}
        </div>
      </Module>

      <FinalQaPanel projectId={project.id} savedQa={toFinalQaData(qa)} />

      <ApprovalPanel
        projectId={project.id}
        savedApproval={toApprovalData(approval)}
      />
    </div>
  );
}

function Module({ title, children }: { title: string; children: ReactNode }) {
  return (
    <details className="mt-6 rounded-xl border border-border bg-card">
      <summary className="cursor-pointer select-none px-4 py-3 text-sm font-medium text-ink">
        {title}
      </summary>
      <div className="border-t border-border px-4 py-3">{children}</div>
    </details>
  );
}

function Empty() {
  return <p className="text-sm text-ink-soft">（暂无内容）</p>;
}

function FieldView({
  data,
  labels,
}: {
  data: Record<string, string>;
  labels: Record<string, string>;
}) {
  return (
    <div className="space-y-2">
      {Object.entries(labels).map(([k, label]) => (
        <div key={k}>
          <div className="text-xs font-medium text-ink-soft">
            {label}
          </div>
          <div className="mt-0.5 whitespace-pre-wrap text-sm text-ink">
            {data[k] || "—"}
          </div>
        </div>
      ))}
    </div>
  );
}

function BudgetView({ budget }: { budget: BudgetData }) {
  const items = budget.items ?? [];
  const total = budget.total;
  const contingency = total * budget.contingencyRate;
  return (
    <div className="text-sm">
      <p className="whitespace-pre-wrap text-ink">{budget.summary || "—"}</p>
      <div className="mt-2 font-medium text-ink">
        总计 {total.toFixed(2)} {budget.currency} · 应急金 {contingency.toFixed(2)} · 合计{" "}
        {(total + contingency).toFixed(2)} {budget.currency}
      </div>
      <ul className="mt-2 space-y-1 text-ink-soft">
        {items.map((i, idx) => (
          <li key={idx}>
            {BUDGET_CATEGORY_LABELS[i.category] ?? i.category} · {i.item} ×{i.quantity}
            {i.unit} @ {i.unitPrice} = {(i.quantity * i.unitPrice).toFixed(2)}
          </li>
        ))}
      </ul>
    </div>
  );
}

function FactsView({ facts }: { facts: { claim: string; status: string }[] }) {
  const mark = (s: string) =>
    s === "FACT" ? "✅" : s === "CONFLICT" ? "❌" : "⚠️";
  return (
    <ul className="space-y-2 text-sm text-ink">
      {facts.map((f, i) => (
        <li key={i} className="flex gap-2">
          <span className="shrink-0">{mark(f.status)}</span>
          <span>
            {f.claim}{" "}
            <span className="text-xs text-ink-soft">
              [{FACT_STATUS_LABELS[f.status] ?? f.status}]
            </span>
          </span>
        </li>
      ))}
    </ul>
  );
}
