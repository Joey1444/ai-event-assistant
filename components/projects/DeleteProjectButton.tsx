"use client";

import { useState } from "react";
import { deleteProject } from "@/lib/actions";

export function DeleteProjectButton({ id }: { id: string }) {
  const [confirming, setConfirming] = useState(false);

  if (!confirming) {
    return (
      <button
        type="button"
        onClick={() => setConfirming(true)}
        className="rounded-lg border border-cinnabar px-4 py-2 text-sm font-medium text-cinnabar transition-colors hover:bg-cinnabar-soft"
      >
        删除项目
      </button>
    );
  }

  return (
    <form action={deleteProject} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <span className="text-sm font-medium text-cinnabar">
        确认删除？此操作不可恢复
      </span>
      <button
        type="submit"
        className="rounded-lg bg-cinnabar px-4 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90"
      >
        确认删除
      </button>
      <button
        type="button"
        onClick={() => setConfirming(false)}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-2"
      >
        取消
      </button>
    </form>
  );
}
