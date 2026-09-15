// AI Provider 抽象层：业务代码只调用 generateText()，不关心底层是哪个模型/网关
// 当前网关 CCSwitch 的 claude 代理暴露的是 Anthropic 兼容的 /v1/messages 协议。
import { aiConfig } from "./config";

export type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export type GenerateTextOptions = {
  messages: ChatMessage[];
  model?: string;
  maxTokens?: number;
  timeoutMs?: number;
};

export class AiError extends Error {
  kind: "network" | "http" | "timeout" | "truncated" | "unknown";
  status?: number;
  causeCode?: string;

  constructor(opts: {
    kind: AiError["kind"];
    message?: string;
    status?: number;
    causeCode?: string;
  }) {
    super(opts.message ?? opts.kind);
    this.name = "AiError";
    this.kind = opts.kind;
    this.status = opts.status;
    this.causeCode = opts.causeCode;
  }
}

export async function generateText({
  messages,
  model,
  maxTokens,
  timeoutMs,
}: GenerateTextOptions): Promise<string> {
  const m = model ?? aiConfig.model;
  const mt = maxTokens ?? aiConfig.maxTokens;
  const timeout = timeoutMs ?? aiConfig.timeoutMs;

  let res: Response;
  try {
    res = await fetch(`${aiConfig.baseURL}/v1/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": aiConfig.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({ model: m, max_tokens: mt, messages }),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (err) {
    const e = err as Error & { cause?: { code?: string } };
    const code = e?.cause?.code ?? "";
    if (e?.name === "AbortError" || e?.name === "TimeoutError") {
      throw new AiError({ kind: "timeout", message: e.message });
    }
    throw new AiError({ kind: "network", message: e.message, causeCode: code });
  }

  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new AiError({ kind: "http", message: body, status: res.status });
  }

  const data = (await res.json()) as {
    content?: Array<{ type?: string; text?: string }>;
    stop_reason?: string | null;
  };
  if (data.stop_reason === "max_tokens") {
    throw new AiError({
      kind: "truncated",
      message: "输出被截断（达到 max_tokens 上限）",
    });
  }
  return extractText(data);
}

function extractText(data: {
  content?: Array<{ type?: string; text?: string }>;
}): string {
  const content = data.content;
  if (!Array.isArray(content)) return "";
  return content
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text as string)
    .join("")
    .trim();
}

// 轻量健康检查：只要网关有响应（哪怕 404），就认为 CCSwitch 在运行
export async function checkAiHealth(): Promise<boolean> {
  try {
    await fetch(`${aiConfig.baseURL}/`, {
      method: "GET",
      signal: AbortSignal.timeout(5000),
    });
    return true;
  } catch {
    return false;
  }
}

// 把底层错误翻译成用户能看懂的提示
export function classifyError(err: unknown): string {
  if (err instanceof AiError) {
    if (err.kind === "truncated") {
      return "AI 输出过长被截断，请降低内容复杂度后重试";
    }
    if (err.kind === "timeout") {
      return "请求超时，AI 响应较慢，请稍后重试";
    }
    if (err.kind === "network") {
      if (err.causeCode === "ECONNREFUSED") {
        return "AI 服务没连上，请确认电脑上的 AI 网关软件已打开，再重试";
      }
      return "网络异常，连不上 AI 服务，请检查网络后重试";
    }
    if (err.kind === "http") {
      const s = err.status ?? 0;
      if (s === 401 || s === 403) {
        return "AI 服务的访问密钥不对，请检查 AI 服务配置";
      }
      if (s === 404) {
        return "AI 服务地址配置有误，请检查 AI 服务设置";
      }
      if (s === 400 || s === 422) {
        return "当前选择的 AI 模型不可用，请在 AI 服务里换一个模型";
      }
      if (s === 429) {
        return "请求太频繁了，请稍后再试";
      }
      if (s >= 500) {
        return "AI 服务暂时异常，请稍后重试";
      }
      return "请求失败，请稍后重试";
    }
  }
  return "操作失败，请重试一次";
}
