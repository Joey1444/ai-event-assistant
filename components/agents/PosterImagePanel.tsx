"use client";

import { useState, useTransition, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { StepHeading } from "@/components/projects/StepHeading";
import {
  generatePosterImage,
  editPosterImage,
  savePosterContent,
} from "@/lib/agents/actions";
import {
  POSTER_FIELDS,
  POSTER_FIELD_LABELS,
  type PosterImageData,
} from "@/lib/agents/types";

export function PosterImagePanel({
  projectId,
  posterContent: initialPosterContent,
  images: initialImages,
  id,
}: {
  projectId: string;
  posterContent: Record<string, string> | null;
  images: PosterImageData[];
  id?: string;
}) {
  const [images, setImages] = useState<PosterImageData[]>(initialImages);
  const [selectedId, setSelectedId] = useState<string | null>(
    initialImages.length > 0
      ? initialImages[initialImages.length - 1].id
      : null,
  );
  const [posterContent, setPosterContent] = useState<Record<string, string> | null>(
    initialPosterContent,
  );
  const [editingPoster, setEditingPoster] = useState(false);
  const [posterDraft, setPosterDraft] = useState<Record<string, string>>({});
  const [humanPrompt, setHumanPrompt] = useState("");
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [instruction, setInstruction] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const selected = images.find((img) => img.id === selectedId) ?? null;

  function applyResult(imgs: PosterImageData[]) {
    setImages(imgs);
    setSelectedId(imgs.length > 0 ? imgs[imgs.length - 1].id : null);
  }

  function handleGenerate() {
    setError(null);
    startTransition(async () => {
      const r = await generatePosterImage(
        projectId,
        humanPrompt.trim() || undefined,
        referenceImages.length > 0 ? referenceImages : undefined,
      );
      if (r.ok) applyResult(r.images);
      else setError(r.error);
    });
  }

  function handleFileChange(e: ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    for (const file of files) {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result;
        if (typeof dataUrl === "string") {
          setReferenceImages((prev) => [...prev, dataUrl]);
        }
      };
      reader.readAsDataURL(file);
    }
    e.target.value = "";
  }

  function startEditPoster() {
    setPosterDraft(posterContent ?? {});
    setEditingPoster(true);
  }

  function handleSavePoster() {
    setError(null);
    startTransition(async () => {
      const r = await savePosterContent(projectId, posterDraft);
      if (r.ok) {
        setPosterContent(r.data.content);
        setEditingPoster(false);
        router.refresh();
      } else {
        setError(r.error);
      }
    });
  }

  function handleEdit() {
    if (!selected || !instruction.trim()) return;
    setError(null);
    startTransition(async () => {
      const r = await editPosterImage(
        projectId,
        instruction.trim(),
        selected.id,
        humanPrompt.trim() || undefined,
        referenceImages.length > 0 ? referenceImages : undefined,
      );
      if (r.ok) {
        applyResult(r.images);
        setInstruction("");
      } else {
        setError(r.error);
      }
    });
  }

  return (
    <section id={id} className="mt-8">
      <div className="flex items-center justify-between">
        <StepHeading id="poster" />
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

      {/* 海报文案（作为文生图输入，可编辑） */}
      <div className="mt-3">
        <div className="flex items-center justify-between">
          <div className="text-xs font-medium text-ink-soft">海报文案（作为文生图输入，可编辑）</div>
          {posterContent && !editingPoster ? (
            <button
              type="button"
              onClick={startEditPoster}
              className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-ink hover:bg-paper-2"
            >
              编辑
            </button>
          ) : null}
          {editingPoster ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleSavePoster}
                disabled={isPending}
                className="rounded-lg bg-ink px-3 py-1 text-xs font-medium text-paper hover:bg-gold disabled:opacity-50"
              >
                {isPending ? "保存中…" : "保存"}
              </button>
              <button
                type="button"
                onClick={() => setEditingPoster(false)}
                className="rounded-lg border border-border px-3 py-1 text-xs font-medium text-ink hover:bg-paper-2"
              >
                取消
              </button>
            </div>
          ) : null}
        </div>
        {editingPoster ? (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {POSTER_FIELDS.map((key) => (
              <div key={key} className="rounded-lg border border-border bg-paper-2 px-3 py-2">
                <label className="block text-xs font-medium text-ink-soft">
                  {POSTER_FIELD_LABELS[key]}
                </label>
                <textarea
                  value={posterDraft[key] ?? ""}
                  onChange={(e) =>
                    setPosterDraft((d) => ({ ...d, [key]: e.target.value }))
                  }
                  rows={2}
                  className="mt-1 w-full rounded-lg border border-border bg-card px-2 py-1 text-sm text-ink focus:border-gold focus:outline-none"
                />
              </div>
            ))}
          </div>
        ) : posterContent ? (
          <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
            {POSTER_FIELDS.map((key) => (
              <div key={key} className="rounded-lg border border-border bg-paper-2 px-3 py-2">
                <div className="text-xs font-medium text-ink-soft">
                  {POSTER_FIELD_LABELS[key]}
                </div>
                <div className="mt-0.5 text-sm text-ink">
                  {posterContent[key] || "—"}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="mt-2 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-3 text-sm text-ink-soft">
            还没有海报文案。点击「生成海报图片」时会自动生成。
          </div>
        )}
      </div>

      {/* 人为提示词（优先级高于小莫自动生成）+ 图片元素 */}
      <div className="mt-3 space-y-1.5">
        <label className="block text-sm font-medium text-ink">
          人为提示词（可选，优先级高于小莫自动生成的提示词）
        </label>
        <textarea
          value={humanPrompt}
          onChange={(e) => setHumanPrompt(e.target.value)}
          placeholder="补充或覆盖文生图提示词，例如：月亮再大一些、背景用更深蓝、加两盏灯笼"
          rows={2}
          className="w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none"
        />
        <div className="flex flex-wrap items-center gap-2">
          <label
            className="cursor-pointer rounded-lg border border-border px-3 py-1.5 text-sm text-ink-soft hover:bg-paper-2"
            title="二维码、logo 等精确图形文生图还原度低，可能无法识别；建议留白后手动贴入"
          >
            添加参考图片元素（二维码等精确图形还原度低）
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleFileChange}
              className="hidden"
            />
          </label>
          {referenceImages.map((img, i) => (
            <div key={i} className="relative">
              {/* base64 data URL 无法被 next/image 优化，用原生 img */}
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={img}
                alt={`元素 ${i + 1}`}
                className="h-14 w-14 rounded-lg border border-border object-cover"
              />
              <button
                type="button"
                onClick={() =>
                  setReferenceImages((prev) => prev.filter((_, idx) => idx !== i))
                }
                className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-cinnabar text-xs text-paper"
                aria-label={`移除元素 ${i + 1}`}
              >
                ×
              </button>
            </div>
          ))}
        </div>
      </div>

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
            {selected.createdByAgent === "user" ? "用户编辑" : "小莫生成"} ·{" "}
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
              placeholder="说明对上一版不满意的地方，例如：月亮太大、背景太暗、加两盏灯笼"
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
                {isPending ? "生成中…（约 20-60 秒）" : "提交修改，重新生成"}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="mt-3 rounded-lg border border-dashed border-border bg-paper-2 px-4 py-6 text-center text-sm text-ink-soft">
          还没有海报图片。点击「生成海报图片」，小莫会用海报文案（可加人为提示词和图片元素）生成第一张海报。
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
