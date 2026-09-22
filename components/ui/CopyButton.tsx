"use client";

import { useState } from "react";

// 通用复制按钮：纯前端 navigator.clipboard，复制后短暂显示「已复制」。
export function CopyButton({
  text,
  label = "复制",
  className = "",
}: {
  text: string;
  label?: string;
  className?: string;
}) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  }

  return (
    <button
      type="button"
      onClick={handleCopy}
      className={`shrink-0 rounded-lg border border-border px-3 py-1 text-xs font-medium text-ink hover:bg-paper-2 ${className}`}
    >
      {copied ? "已复制" : label}
    </button>
  );
}
