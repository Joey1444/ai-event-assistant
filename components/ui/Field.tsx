import type { ReactNode } from "react";

export const inputClass =
  "w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink placeholder:text-ink-soft focus:border-gold focus:outline-none";

export function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-ink">
        {label}
        {required ? <span className="ml-0.5 text-cinnabar">*</span> : null}
      </span>
      {children}
    </label>
  );
}
