"use client";

import { useState } from "react";
import { deleteProject } from "@/lib/actions";

export function DeleteProjectButton({ id }: { id: string }) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-lg border border-cinnabar px-4 py-2 text-sm font-medium text-cinnabar transition-colors hover:bg-cinnabar-soft"
      >
        删除项目
      </button>

      {open ? (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-ink/40 p-4"
          onClick={() => setOpen(false)}
        >
          <div
            role="dialog"
            aria-modal="true"
            className="w-full max-w-md rounded-xl border border-border bg-card p-5 shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="font-serif text-base font-semibold text-cinnabar">
              确认删除这个项目吗？
            </h3>
            <p className="mt-2 text-sm text-ink-soft">
              小莫提示：删除后无法恢复。这个项目下的所有内容（活动方案、预算、文案、海报图片）都会一并删除。
            </p>
            <form action={deleteProject} className="mt-4 flex justify-end gap-3">
              <input type="hidden" name="id" value={id} />
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-2"
              >
                取消
              </button>
              <button
                type="submit"
                className="rounded-lg bg-cinnabar px-4 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90"
              >
                确认删除
              </button>
            </form>
          </div>
        </div>
      ) : null}
    </>
  );
}
