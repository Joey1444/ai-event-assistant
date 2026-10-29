import Link from "next/link";
import { getAiConfig, getImageConfig } from "@/lib/ai/config";
import { checkAiHealth } from "@/lib/ai/provider";
import { maskKey } from "@/lib/env";
import { isPublicMode } from "@/lib/publicMode";
import { AiTestPanel } from "@/components/AiTestPanel";
import { AiConfigForm } from "@/components/AiConfigForm";

export const dynamic = "force-dynamic";

export default async function AiTestPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const { projectId } = await searchParams;
  const publicMode = isPublicMode();
  // 公网演示环境不主动探测模型（每次探测都是一次真实计费调用），只展示配置状态
  const healthy = publicMode ? true : await checkAiHealth();
  const ai = getAiConfig();
  const image = getImageConfig();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <h1 className="font-serif text-3xl font-bold text-ink">
        AI Gateway Status
      </h1>
      <p className="mt-1 text-ink-soft">
        {publicMode ? "在线演示环境：模型由管理员预设" : "配置你的模型后测试连通性"}
      </p>

      <dl className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        <Row label="文本 Base URL" value={safeHostname(ai.baseURL)} />
        <Row label="文本 Model" value={ai.model} />
        <Row label="文生图 Model" value={image.model || "（未配置）"} />
      </dl>

      {publicMode ? (
        <div className="mt-6 rounded-xl border border-border bg-card p-5 text-sm text-ink-soft">
          当前为在线演示环境，模型配置由管理员在平台侧预设，访客不可修改。
          本地运行时可在此页面填写自己的模型地址、模型名与 API Key。
        </div>
      ) : (
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
      )}

      {publicMode ? null : (
        <AiTestPanel initialStatus={healthy ? "CONNECTED" : "DISCONNECTED"} />
      )}

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
