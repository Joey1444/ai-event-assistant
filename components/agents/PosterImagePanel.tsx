"use client";

import { useState, useTransition } from "react";
import { generatePosterImage, editPosterImage } from "@/lib/agents/actions";
import type { PosterImageData } from "@/lib/agents/types";

export function PosterImagePanel({
  projectId,
  images: initialImages,
}: {
  projectId: string;
  images: PosterImageData[];
}) {
  const [images, setImages] = useState<PosterImageData[]>(initialImages);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialImages.length > 0
      ? initialImages[initialImages.length - 1].id
      : null,
  );
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const selected = images.find((img) => img.id === selectedId) ?? null;

  function applyResult(imgs: PosterImageData[]) {
    setImages(imgs);
    setSelectedId(imgs.length > 0 ? imgs[imgs.length - 1].id : null);
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const r = await generatePosterImage(projectId);
      if (r.ok) applyResult(r.images);
      else setError(r.error);
    });
  }

  function handleEdit() {
    if (!selected || !instruction.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await editPosterImage(projectId, instruction.trim(), selected.id);
      if (r.ok) {
        applyResult(r.images);
        setInstruction("");
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section className="mt-8">
      <div className="flex items-center justify-between">
        <h2 className="font-serif text-sm font-semibold tracking-wide text-ink-soft">
          海报图片
        </h2>
        <button
          type="button"
          onClick={handleGenerate}
          disabled={isPending}
          className="rounded-lg bg-ink px-4 py-2 text-sm font-medium text-paper hover:bg-gold disabled:opacity-50"
        >
          {isPending
            ? "生成中…（约 20-60 秒）"
            : images.length > 0
              ? "重新生成"
              : "生成海报图片"}
        </button>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}

      {selected ? (
        <div className="mt-3 space-y-3">
          <div className="overflow-hidden rounded-xl border border-border bg-card p-4">
            {/* base64 data URL 无法被 next/image 优化，用原生 img */}
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={selected.imageDataUrl}
              alt="活动海报"
              className="mx-auto block max-h-[640px] w-auto rounded"
            />
          </div>

          <div className="text-xs text-ink-soft">
            版本 {selected.version} ·{" "}
            {selected.createdByAgent === "user" ? "用户编辑" : "AI 生成"} ·{" "}
            {formatDate(selected.createdAt)}
            {selected.parentVersion != null
              ? ` · 基于版本 ${selected.parentVersion}`
              : ""}
          </div>

          {selected.editInstruction ? (
            <div className="rounded-lg border border-border bg-paper-2 px-4 py-3 text-sm text-ink-soft">
              <span className="font-medium text-ink">本次修改：</span>
              {selected.editInstruction}
            </div>
          ) : null}

          {images.length > 1 ? (
            <div className="flex gap-2 overflow-x-auto pb-2">
              {images.map((img) => (
                <button
                  key={img.id}
                  type="button"
                  onClick={() => setSelectedId(img.id)}
                  title={`版本 ${img.version}`}
                  className={`shrink-0 overflow-hidden rounded-lg border-2 ${
                    img.id === selectedId ? "border-gold" : "border-border"
                  }`}
                >
                  {/* base64 data URL 无法被 next/image 优化，用原生 img */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={img.imageDataUrl}
                    alt={`版本 ${img.version}`}
                    loading="lazy"
                    className="h-20 w-16 object-cover"
                  />
                </button>
              ))}
            </div>
          ) : null}

          <div className="space-y-2">
            <textarea
              value={instruction}
              onChange={(e) => setInstruction(e.target.value)}
              placeholder="基于当前选中的版本修改，例如：把主标题改成新文案，或调整背景配色"
              rows={2}
              className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={handleEdit}
                disabled={isPending || !instruction.trim()}
                className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-ink hover:bg-paper-2 disabled:opacity-50"
              >
                {isPending ? "生成中…（约 20-60 秒）" : "基于此图修改"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有海报图片。生成海报内容后，点击「生成海报图片」用文生图模型出图。
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
