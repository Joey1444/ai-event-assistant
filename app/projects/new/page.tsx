import Link from "next/link";
import { createProject } from "@/lib/actions";
import { ProjectForm } from "@/components/projects/ProjectForm";

export default async function NewProjectPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link
        href="/"
        className="text-sm text-ink-soft hover:text-ink"
      >
        ← 返回项目列表
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold text-ink">
        新建活动策划项目
      </h1>
      <p className="mb-8 mt-1 text-ink-soft">
        填写活动的基础信息，后续 AI 将基于这些信息展开策划。
      </p>

      {error === "missing-required" ? (
        <div className="mb-6 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          请填写「项目名称」和「主办机构」这两个必填项。
        </div>
      ) : null}

      <ProjectForm action={createProject} submitLabel="创建项目">
        <Link
          href="/"
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-ink transition-colors hover:bg-paper-2"
        >
          取消
        </Link>
      </ProjectForm>
    </div>
  );
}
