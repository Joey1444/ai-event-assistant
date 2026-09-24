import Link from "next/link";
import { getAiConfig, getImageConfig } from "@/lib/ai/config";
import { checkAiHealth } from "@/lib/ai/provider";
import { maskKey } from "@/lib/env";
import { AiTestPanel } from "@/components/AiTestPanel";
import { AiConfigForm } from "@/components/AiConfigForm";

export const dynamic = "force-dynamic";

export default async function AiTestPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const healthy = await checkAiHealth();
  const ai = getAiConfig();
  const image = getImageConfig();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="font-serif text-3xl font-bold text-ink">
        AI Gateway Status
      </h1>
      <p className="mt-1 text-ink-soft">配置你的模型后测试连通性</p>

      <dl className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        <Row label="文本 Base URL" value={safeHostname(ai.baseURL)} />
        <Row label="文本 Model" value={ai.model} />
        <Row label="文生图 Model" value={image.model || "（未配置）"} />
      </dl>

      <AiConfigForm
        initial={{
          text: {
            baseUrl: ai.baseURL,
            model: ai.model,
            keyHint: maskKey(ai.apiKey),
          },
          image: {
            baseUrl: image.baseURL,
            model: image.model || "wan2.7-image-pro",
            keyHint: maskKey(image.apiKey),
          },
          tavily: {
            keyHint: maskKey(process.env.EP_TAVILY_API_KEY ?? ""),
          },
        }}
      />

      <AiTestPanel initialStatus={healthy ? "CONNECTED" : "DISCONNECTED"} />

      <div className="mt-8 border-t border-border pt-4">
        <Link
          href={projectId ? `/projects/${projectId}` : "/"}
          className="text-sm text-ink-soft hover:text-ink"
        >
          ← {projectId ? "返回项目页" : "返回项目列表"}
        </Link>
      </div>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex px-4 py-3">
      <dt className="w-32 shrink-0 text-sm text-ink-soft">{label}</dt>
      <dd className="text-sm text-ink">{value}</dd>
    </div>
  );
}

function safeHostname(url: string): string {
  try {
    return new URL(url).hostname;
  } catch {
    return url;
  }
}
