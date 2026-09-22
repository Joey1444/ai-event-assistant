import Link from "next/link";
import { aiConfig } from "@/lib/ai/config";
import { checkAiHealth } from "@/lib/ai/provider";
import { AiTestPanel } from "@/components/AiTestPanel";

export const dynamic = "force-dynamic";

export default async function AiTestPage() {
  const healthy = await checkAiHealth();

  return (
    <div className="mx-auto w-full max-w-2xl flex-1 px-6 py-10">
      <Link href="/" className="text-sm text-ink-soft hover:text-ink">
        ← 返回首页
      </Link>
      <h1 className="mt-4 font-serif text-3xl font-bold text-ink">
        AI Gateway Status
      </h1>
      <p className="mt-1 text-ink-soft">直连 DeepSeek 官方 API</p>

      <dl className="mt-6 divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
        <Row label="Provider" value="DeepSeek" />
        <Row label="Base URL" value={safeHostname(aiConfig.baseURL)} />
        <Row label="Model" value={aiConfig.model} />
      </dl>

      <AiTestPanel initialStatus={healthy ? "CONNECTED" : "DISCONNECTED"} />
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
