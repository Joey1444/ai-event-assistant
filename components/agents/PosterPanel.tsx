"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generatePoster, savePosterVersion } from "@/lib/agents/actions";
import {
  POSTER_FIELDS,
  POSTER_FIELD_LABELS,
  type VersionedContentData,
} from "@/lib/agents/types";

export function PosterPanel({
  projectId,
  latestPoster,
}: {
  projectId: string;
  latestPoster: VersionedContentData | null;
}) {
  const [data, setData] = useState<VersionedContentData | null>(latestPoster);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  function copyAll() {
    if (!data) return;
    const text = POSTER_FIELDS.map(
      (k) => `${POSTER_FIELD_LABELS[k]}\n${data.content[k] ?? ""}`,
    ).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const r = await generatePoster(projectId);
      if (r.ok) {
        setData(r.data);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function startEdit() {
    setDraft(data?.content ?? {});
    setEditing(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await savePosterVersion(projectId, draft);
      if (r.ok) {
        setData(r.data);
        setEditing(false);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">海报</h2>
        <div className="flex gap-2">
          {editing ? (
            <>
              <button
                type="button"
                onClick={handleSave}
                disabled={isPending}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
              >
                {isPending ? "保存中…" : "保存版本"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
              >
                取消
              </button>
            </>
          ) : (
            <>
              {data ? (
                <>
                  <button
                    type="button"
                    onClick={startEdit}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
                  >
                    编辑
                  </button>
                  <button
                    type="button"
                    onClick={copyAll}
                    className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
                  >
                    {copied ? "已复制" : "复制全部"}
                  </button>
                </>
              ) : null}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
              >
                {isPending ? "生成中…（约 20-60 秒）" : data ? "重新生成" : "生成海报"}
              </button>
            </>
          )}
        </div>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {data ? (
        <div className="mt-3 space-y-3">
          <div className="text-xs text-ink-soft">
            版本 {data.version} ·{" "}
            {data.createdByAgent === "user" ? "用户编辑" : "小莫生成"} ·{" "}
            {formatDate(data.createdAt)}
          </div>

          {editing ? (
            <div className="space-y-4">
              {POSTER_FIELDS.map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-ink">
                    {POSTER_FIELD_LABELS[key]}
                  </label>
                  <textarea
                    value={draft[key] ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [key]: e.target.value }))
                    }
                    rows={2}
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                  />
                </div>
              ))}
            </div>
          ) : (
            <>
              <PosterPreview content={data.content} />
              {POSTER_FIELDS.map((key) => (
                <div
                  key={key}
                  className="rounded-lg border border-border bg-card px-4 py-3"
                >
                  <div className="text-xs font-medium text-ink-soft">
                    {POSTER_FIELD_LABELS[key]}
                  </div>
                  <div className="mt-1 whitespace-pre-wrap text-sm text-ink">
                    {data.content[key] || "—"}
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有海报。生成详细活动方案后，点击「生成海报」。
        </div>
      )}
    </section>
  );
}

function PosterPreview({ content }: { content: Record<string, string> }) {
  return (
    <div className="mx-auto aspect-[3/4] w-full max-w-sm overflow-hidden rounded-xl bg-gradient-to-b from-[#0a1a3a] via-[#0d2247] to-[#16294f] p-6 text-center shadow-xl">
      <div className="relative flex h-full flex-col justify-between">
        <div className="absolute right-5 top-4 h-16 w-16 rounded-full bg-gradient-to-br from-amber-200 to-amber-400 shadow-[0_0_30px_rgba(251,191,36,0.5)]" />

        <div className="relative pt-20">
          <div className="text-[11px] uppercase tracking-[0.3em] text-amber-300/80">
            Mid-Autumn Festival
          </div>
          <div className="mt-3 text-2xl font-bold leading-snug text-amber-300">
            {content.headline || "—"}
          </div>
          {content.subtitle ? (
            <div className="mt-2 text-sm text-paper/85">{content.subtitle}</div>
          ) : null}
        </div>

        <div className="relative space-y-1.5 text-sm text-paper/90">
          <div>📅 {content.eventDate || "—"}</div>
          <div>🕒 {content.eventTime || "—"}</div>
          <div>📍 {content.venue || "—"}</div>
          <div>🏛️ {content.organizer || "—"}</div>
        </div>

        <div className="relative">
          <div className="inline-block rounded-full bg-amber-400 px-5 py-1.5 text-sm font-semibold text-[#0a1a3a]">
            {content.callToAction || "欢迎参加"}
          </div>
          {content.contact ? (
            <div className="mt-2 text-xs text-paper/70">
              📞 {content.contact}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleString("zh-CN", {
      dateStyle: "short",
      timeStyle: "short",
    });
  } catch {
    return iso;
  }
}
