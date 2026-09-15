"use client";

import { useState, useTransition } from "react";
import { generateDesign, saveDesignVersion } from "@/lib/agents/actions";
import type { DesignData } from "@/lib/agents/types";

export function PosterDesignPanel({
  projectId,
  latestDesign,
}: {
  projectId: string;
  latestDesign: DesignData | null;
}) {
  const [design, setDesign] = useState<DesignData | null>(latestDesign);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const r = await generateDesign(projectId);
      if (r.ok) setDesign(r.design);
      else setError(r.error);
    });
  }

  function startEdit() {
    setDraft(design?.html ?? "");
    setEditing(true);
  }

  function handleSave() {
    setError(null);
    startTransition(async () => {
      const r = await saveDesignVersion(projectId, draft);
      if (r.ok) {
        setDesign(r.design);
        setEditing(false);
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">网页海报设计</h2>
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
              {design ? (
                <button
                  type="button"
                  onClick={startEdit}
                  className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2"
                >
                  编辑 HTML
                </button>
              ) : null}
              <button
                type="button"
                onClick={handleGenerate}
                disabled={isPending}
                className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
              >
                {isPending ? "生成中…" : design ? "重新生成" : "生成海报设计"}
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

      {design ? (
        <div className="mt-3 space-y-3">
          <div className="text-xs text-ink-soft">
            版本 {design.version} ·{" "}
            {design.createdByAgent === "user" ? "用户编辑" : "AI 生成"} ·{" "}
            {formatDate(design.createdAt)}
          </div>

          {editing ? (
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={24}
              spellCheck={false}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 font-mono text-xs text-ink focus:border-gold focus:outline-none"
            />
          ) : (
            <div className="overflow-hidden rounded-xl border border-border bg-card">
              <iframe
                srcDoc={design.html}
                sandbox="allow-same-origin"
                title="海报预览"
                className="w-full border-0"
                style={{ height: 720 }}
              />
            </div>
          )}
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有海报设计。生成详细活动方案后，点击「生成海报设计」让设计 Agent 直接输出 HTML 海报。
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
