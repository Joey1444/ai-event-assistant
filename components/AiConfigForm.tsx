"use client";

import { useState, useTransition, type FormEvent } from "react";
import { saveAiConfig } from "@/lib/ai/actions";

type Section = {
  baseUrl: string;
  model: string;
  keyHint: string;
};

export function AiConfigForm({
  initial,
}: {
  initial: { text: Section; image: Section; tavily: { keyHint: string } };
}) {
  const [text, setText] = useState({
    baseUrl: initial.text.baseUrl,
    model: initial.text.model,
    apiKey: "",
  });
  const [image, setImage] = useState({
    baseUrl: initial.image.baseUrl,
    model: initial.image.model,
    apiKey: "",
  });
  const [tavilyKey, setTavilyKey] = useState("");
  const [hint, setHint] = useState({
    text: initial.text.keyHint,
    image: initial.image.keyHint,
    tavily: initial.tavily.keyHint,
  });
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSaved(false);
    startTransition(async () => {
      const r = await saveAiConfig({
        text: { baseUrl: text.baseUrl, model: text.model, apiKey: text.apiKey },
        image: {
          baseUrl: image.baseUrl,
          model: image.model,
          apiKey: image.apiKey,
        },
        tavilyKey,
      });
      if (r.ok) {
        setHint({ text: r.hint.text, image: r.hint.image, tavily: r.hint.tavily });
        setText((v) => ({ ...v, apiKey: "" }));
        setImage((v) => ({ ...v, apiKey: "" }));
        setTavilyKey("");
        setSaved(true);
      } else {
        setError(r.error);
      }
    });
  }

  const inputCls =
    "mt-1 w-full rounded-lg border border-border bg-card px-3 py-2 text-sm text-ink focus:border-gold focus:outline-none";

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-6 rounded-xl border border-border bg-card p-5"
    >
      <div className="text-sm font-semibold text-ink">模型配置</div>
      <p className="mt-1 text-xs text-ink-soft">
        配置写入项目 .env。提交后 API Key 不再明文显示；留空 API Key 表示不修改。
      </p>

      <div className="mt-4 rounded-lg border border-border bg-paper-2 p-4">
        <div className="text-sm font-medium text-ink">文本模型</div>
        <label className="mt-3 block text-xs text-ink-soft">
          Base URL
          <input
            type="url"
            value={text.baseUrl}
            onChange={(e) =>
              setText((v) => ({ ...v, baseUrl: e.target.value }))
            }
            placeholder="https://api.deepseek.com"
            className={inputCls}
          />
        </label>
        <label className="mt-3 block text-xs text-ink-soft">
          模型名
          <input
            value={text.model}
            onChange={(e) => setText((v) => ({ ...v, model: e.target.value }))}
            placeholder="deepseek-v4-pro"
            className={inputCls}
          />
        </label>
        <label className="mt-3 block text-xs text-ink-soft">
          API Key
          <input
            value={text.apiKey}
            onChange={(e) => setText((v) => ({ ...v, apiKey: e.target.value }))}
            placeholder={
              hint.text ? `已配置（${hint.text}），留空则不修改` : "未配置"
            }
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-paper-2 p-4">
        <div className="text-sm font-medium text-ink">文生图模型</div>
        <label className="mt-3 block text-xs text-ink-soft">
          Base URL
          <input
            type="url"
            value={image.baseUrl}
            onChange={(e) =>
              setImage((v) => ({ ...v, baseUrl: e.target.value }))
            }
            placeholder="https://maas.qianwenaiapi.com/api/v1"
            className={inputCls}
          />
        </label>
        <label className="mt-3 block text-xs text-ink-soft">
          模型名
          <input
            value={image.model}
            onChange={(e) => setImage((v) => ({ ...v, model: e.target.value }))}
            placeholder="wan2.7-image-pro"
            className={inputCls}
          />
        </label>
        <label className="mt-3 block text-xs text-ink-soft">
          API Key
          <input
            value={image.apiKey}
            onChange={(e) => setImage((v) => ({ ...v, apiKey: e.target.value }))}
            placeholder={
              hint.image ? `已配置（${hint.image}），留空则不修改` : "未配置"
            }
            className={inputCls}
          />
        </label>
      </div>

      <div className="mt-4 rounded-lg border border-border bg-paper-2 p-4">
        <div className="text-sm font-medium text-ink">联网检索（Tavily）</div>
        <label className="mt-3 block text-xs text-ink-soft">
          API Key
          <input
            value={tavilyKey}
            onChange={(e) => setTavilyKey(e.target.value)}
            placeholder={
              hint.tavily ? `已配置（${hint.tavily}），留空则不修改` : "未配置"
            }
            className={inputCls}
          />
        </label>
      </div>

      {error ? (
        <div className="mt-3 rounded-lg border border-cinnabar-soft bg-cinnabar-soft px-4 py-3 text-sm text-cinnabar">
          {error}
        </div>
      ) : null}
      {saved ? (
        <div className="mt-3 rounded-lg border border-ok-soft bg-ok-soft px-4 py-3 text-sm text-ok">
          配置已保存，稍候即可测试（若仍用旧配置请刷新页面）。
        </div>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="mt-4 rounded-lg bg-ink px-5 py-2.5 text-sm font-medium text-paper transition-colors hover:bg-gold disabled:opacity-50"
      >
        {isPending ? "保存中…" : "保存配置"}
      </button>
    </form>
  );
}
