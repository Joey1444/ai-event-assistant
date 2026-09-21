"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateCopy, saveCopyVersion } from "@/lib/agents/actions";
import {
  COPY_FIELDS,
  COPY_FIELD_LABELS,
  type VersionedContentData,
} from "@/lib/agents/types";

export function CopyPanel({
  projectId,
  latestCopy,
}: {
  projectId: string;
  latestCopy: VersionedContentData | null;
}) {
  const [data, setData] = useState<VersionedContentData | null>(latestCopy);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const [copied, setCopied] = useState(false);

  function copyAll() {
    if (!data) return;
    const text = COPY_FIELDS.map(
      (k) => `${COPY_FIELD_LABELS[k]}\n${data.content[k] ?? ""}`,
    ).join("\n\n");
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const r = await generateCopy(projectId);
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
      const r = await saveCopyVersion(projectId, draft);
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
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">宣传文案</h2>
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
                {isPending ? "生成中…（约 20-60 秒）" : data ? "重新生成" : "生成文案"}
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
            {data.createdByAgent === "user" ? "用户编辑" : "AI 生成"} ·{" "}
            {formatDate(data.createdAt)}
          </div>
          {editing ? (
            <div className="space-y-4">
              {COPY_FIELDS.map((key) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-ink">
                    {COPY_FIELD_LABELS[key]}
                  </label>
                  <textarea
                    value={draft[key] ?? ""}
                    onChange={(e) =>
                      setDraft((d) => ({ ...d, [key]: e.target.value }))
                    }
                    rows={3}
                    className="mt-1.5 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
                  />
                </div>
              ))}
            </div>
          ) : (
            COPY_FIELDS.map((key) => (
              <div
                key={key}
                className="rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="text-xs font-medium text-ink-soft">
                  {COPY_FIELD_LABELS[key]}
                </div>
                <div className="mt-1 whitespace-pre-wrap text-sm text-ink">
                  {data.content[key] || "—"}
                </div>
              </div>
            ))
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有文案。生成详细活动方案后，点击「生成文案」。
        </div>
      )}
    </section>
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
