"use client";

import { useRouter } from "next/navigation";
import type { NextAction } from "@/lib/workflow";

// 「下一步」引导条：一眼看到当前该做什么，点击可平滑滚动到对应面板或跳转到审批页。
export function NextActionBar({ action }: { action: NextAction }) {
  const router = useRouter();
  const done = action.href === "";

  function handleClick() {
    if (!action.href) return;
    // 页内锚点：平滑滚动到对应面板。
    if (action.href.startsWith("#")) {
      const el = document.getElementById(action.href.slice(1));
      if (el) {
        el.scrollIntoView({ behavior: "smooth", block: "start" });
      }
      return;
    }
    // 跨页目标（如审批页）：直接跳转。
    router.push(action.href);
  }

  return (
    <div className="sticky top-0 z-10 mt-5 flex items-center justify-between gap-4 rounded-xl border border-gold bg-gold-soft px-5 py-3.5">
      <div className="flex min-w-0 items-center gap-2">
        {done ? (
          <span className="font-serif text-base font-semibold text-ok">
            ✓ 全部完成
          </span>
        ) : (
          <>
            <span className="shrink-0 text-sm font-medium text-ink-soft">
              下一步：
            </span>
            <span className="truncate font-serif text-base font-semibold text-ink">
              {action.text}
            </span>
          </>
        )}
      </div>
      {done ? null : (
        <button
          type="button"
          onClick={handleClick}
          className="shrink-0 rounded-lg bg-gold px-4 py-2 text-sm font-medium text-paper transition-colors hover:bg-ink"
        >
          去处理
        </button>
      )}
    </div>
  );
}
