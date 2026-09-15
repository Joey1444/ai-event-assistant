import Link from "next/link";
import { prisma } from "@/lib/db";
import { Badge } from "@/components/ui/Badge";
import { STATUS_LABELS, STATUS_TONES, type ProjectStatus } from "@/lib/status";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const projects = await prisma.project.findMany({
    orderBy: { updatedAt: "desc" },
  });

  return (
    <div className="mx-auto w-full max-w-5xl flex-1 px-6 py-10">
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-serif text-3xl font-bold text-ink">
            AI 活动策划助手
          </h1>
          <p className="mt-1 text-ink-soft">
            从需求到方案、预算、文案、海报的一站式策划
          </p>
        </div>
        <Link
          href="/projects/new"
          className="rounded-lg bg-gold px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink"
        >
          + 新建项目
        </Link>
      </header>

      {projects.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-20 text-center text-ink-soft">
          还没有项目。点击右上角「新建项目」开始。
        </div>
      ) : (
        <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
          {projects.map((p) => {
            const status = p.status as ProjectStatus;
            return (
              <li key={p.id}>
                <Link
                  href={`/projects/${p.id}`}
                  className="flex items-center justify-between gap-4 px-6 py-4 transition-colors hover:bg-paper-2"
                >
                  <div className="min-w-0">
                    <div className="truncate font-medium text-ink">
                      {p.projectName}
                    </div>
                    <div className="mt-0.5 truncate text-sm text-ink-soft">
                      {p.organization}
                    </div>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <Badge tone={STATUS_TONES[status]}>
                      {STATUS_LABELS[status]}
                    </Badge>
                    <span className="w-32 text-right text-xs text-ink-soft">
                      {formatDate(p.updatedAt)}
                    </span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function formatDate(d: Date) {
  return d.toLocaleString("zh-CN", { dateStyle: "short", timeStyle: "short" });
}
