"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { generateConcepts } from "@/lib/agents/actions";
import {
  CONCEPT_FIELD_LABELS,
  CONCEPT_FIELD_ORDER,
  type ConceptData,
} from "@/lib/agents/types";

export function ConceptPanel({
  projectId,
  savedConcepts,
  id,
}: {
  projectId: string;
  savedConcepts: ConceptData[];
  id?: string;
}) {
  const [concepts, setConcepts] = useState<ConceptData[]>(savedConcepts);
  const [selected, setSelected] = useState<string>(
    savedConcepts[0]?.variant ?? "A",
  );
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const r = await generateConcepts(projectId);
      if (r.ok) {
        setConcepts(r.concepts);
        setSelected(r.concepts[0]?.variant ?? "A");
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  const current = concepts.find((c) => c.variant === selected) ?? concepts[0];

  return (
    <section id={id} className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">活动方案</h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isPending ? "生成中…" : concepts.length > 0 ? "重新生成" : "生成方案"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {concepts.length > 0 && current ? (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {concepts.map((c) => (
              <button
                key={c.variant}
                type="button"
                onClick={() => setSelected(c.variant)}
                className={
                  "rounded-full px-3 py-1.5 text-sm font-medium " +
                  (c.variant === selected
                    ? "bg-ink text-paper"
                    : "bg-paper-2 text-ink-soft hover:bg-paper-2")
                }
              >
                查看 {c.variant} · {c.direction}
              </button>
            ))}
          </div>

          <dl className="mt-3 divide-y divide-border rounded-xl border border-border bg-card">
            {CONCEPT_FIELD_ORDER.map((key) => (
              <div key={key} className="flex px-4 py-3">
                <dt className="w-28 shrink-0 text-sm text-ink-soft">
                  {CONCEPT_FIELD_LABELS[key]}
                </dt>
                <dd className="whitespace-pre-wrap text-sm text-ink">
                  {current[key] || "—"}
                </dd>
              </div>
            ))}
          </dl>
        </>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有方案。点击「生成方案」，让策划师基于项目简报生成三个方向不同的方案。
        </div>
      )}
    </section>
  );
}
