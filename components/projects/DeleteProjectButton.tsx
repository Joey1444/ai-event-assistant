"use client";

import { useState } from "react";
import { deleteProject } from "@/lib/actions";

export function DeleteProjectButton({ id }: { id: string }) {
  const [step, setStep] = useState<0 | 1 | 2>(0);

  if (step === 0) {
    return (
      <button
        type="button"
        onClick={() => setStep(1)}
        className="rounded-lg border border-cinnabar px-4 py-2 text-sm font-medium text-cinnabar transition-colors hover:bg-cinnabar-soft"
      >
        删除项目
      </button>
    );
  }

  if (step === 1) {
    return (
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium text-cinnabar">
          确认要删除这个项目吗？
        </span>
        <button
          type="button"
          onClick={() => setStep(2)}
          className="rounded-lg border border-cinnabar px-4 py-2 text-sm font-medium text-cinnabar transition-colors hover:bg-cinnabar-soft"
        >
          继续
        </button>
        <button
          type="button"
          onClick={() => setStep(0)}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-2"
        >
          取消
        </button>
      </div>
    );
  }

  return (
    <form action={deleteProject} className="flex items-center gap-3">
      <input type="hidden" name="id" value={id} />
      <div className="text-sm text-cinnabar">
        <div className="font-medium">小莫提示：删除后无法恢复</div>
        <div className="mt-0.5 text-ink-soft">
          这个项目下的所有内容（活动方案、预算、文案、海报图片）都会一并删除。
        </div>
      </div>
      <button
        type="submit"
        className="rounded-lg bg-cinnabar px-4 py-2 text-sm font-medium text-paper transition-colors hover:opacity-90"
      >
        最终确认删除
      </button>
      <button
        type="button"
        onClick={() => setStep(0)}
        className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink transition-colors hover:bg-paper-2"
      >
        取消
      </button>
    </form>
  );
}
