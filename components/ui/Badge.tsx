import type { ReactNode } from "react";

type Tone = "dark" | "muted" | "green" | "amber" | "red";

const tones: Record<Tone, string> = {
  dark: "bg-ink text-paper",
  muted: "bg-paper-2 text-ink-soft",
  green: "bg-ok-soft text-ok",
  amber: "bg-gold-soft text-gold",
  red: "bg-cinnabar-soft text-cinnabar",
};

export function Badge({
  children,
  tone = "dark",
}: {
  children: ReactNode;
  tone?: Tone;
}) {
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${tones[tone]}`}
    >
      {children}
    </span>
  );
}
