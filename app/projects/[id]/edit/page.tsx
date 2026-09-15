import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { updateProject } from "@/lib/actions";
import { ProjectForm } from "@/components/projects/ProjectForm";

export const dynamic = "force-dynamic";

export default async function EditProjectPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error } = await searchParams;

  const project = await prisma.project.findUnique({
    where: { id },
    include: { brief: true },
  });
  if (!project) notFound();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href={`/projects/${project.id}`}
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← 返回项目详情
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold text-ink">编辑项目</h1>
      <p className="mb-8 mt-1 text-ink-soft">修改项目的基础信息。</p>

      {error === "missing-required" ? (
        <div className="mb-6 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          请填写「项目名称」和「主办机构」这两个必填项。
        </div>
      ) : null}

      <ProjectForm
        action={updateProject}
        projectId={project.id}
        defaultValues={{
          projectName: project.projectName,
          organization: project.organization,
          eventType: project.brief?.eventType ?? undefined,
          eventDate: project.brief?.eventDate ?? undefined,
          expectedParticipants:
            project.brief?.expectedParticipants ?? undefined,
          budget: project.brief?.budget ?? undefined,
          location: project.brief?.location ?? undefined,
          targetAudience: project.brief?.targetAudience ?? undefined,
          objective: project.brief?.objective ?? undefined,
          requirements: project.brief?.requirements ?? undefined,
          notes: project.brief?.notes ?? undefined,
        }}
        submitLabel="保存修改"
      >
        <Link
          href={`/projects/${project.id}`}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-2"
        >
          取消
        </Link>
      </ProjectForm>
    </div>
  );
}
