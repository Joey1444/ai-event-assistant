"use client";

import { useState, useTransition } from "react";
import { testAi } from "@/lib/ai/actions";

export function AiTestPanel({ initialStatus }: { initialStatus: string }) {
  const [status, setStatus] = useState(initialStatus);
  const [response, setResponse] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handleTest() {
    setResponse(null);
    startTransition(async () => {
      const r = await testAi();
      if (r.ok) {
        setStatus("CONNECTED");
        setResponse(r.text);
      } else {
        setStatus("DISCONNECTED");
        setResponse(r.error);
      }
    });
  }

  const connected = status === "CONNECTED";

  return (
    <div className="mt-8">
      <div className="flex items-center gap-3">
        <span className="text-sm text-ink-soft">状态：</span>
        <span
          className={
            "rounded-full px-2.5 py-0.5 text-xs font-medium " +
            (connected ? "bg-green-100 text-green-800" : "bg-cinnabar-soft text-cinnabar")
          }
        >
          {status === "CONNECTED" ? "已连接" : "未连接"}
        </span>
      </div>

      <button
        type="button"
        onClick={handleTest}
        disabled={isPending}
        className="mt-4 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-gold disabled:opacity-50"
      >
        {isPending ? "测试中…" : "测试 AI"}
      </button>

      {response !== null ? (
        <div className="mt-4 rounded-lg border border-border bg-card px-4 py-3">
          <div className="text-xs font-medium text-ink-soft">响应：</div>
          <div className="mt-1 whitespace-pre-wrap text-sm text-ink">
            {response || "（空）"}
          </div>
        </div>
      ) : null}
    </div>
  );
}
