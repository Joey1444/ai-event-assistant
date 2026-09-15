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
  kind: "network" | "http" | "timeout" | "unknown";
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
  };
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
    if (err.kind === "timeout") {
      return "请求超时：网络慢或 Provider 响应慢";
    }
    if (err.kind === "network") {
      if (err.causeCode === "ECONNREFUSED") {
        return `CCSwitch 没启动：无法连接 ${aiConfig.baseURL}，请确认 CCSwitch 正在运行`;
      }
      if (err.causeCode === "ENOTFOUND") {
        return "网络错误：无法解析 Base URL 的主机名";
      }
      return "网络错误：无法连接 AI 网关（" + (err.causeCode || "未知原因") + "）";
    }
    if (err.kind === "http") {
      const s = err.status ?? 0;
      if (s === 401 || s === 403) {
        return "API Key 错误：CCSwitch 拒绝了请求的鉴权信息";
      }
      if (s === 404) {
        return "Base URL 错误：找不到 /v1/messages 端点，请检查 AI_BASE_URL";
      }
      if (s === 400 || s === 422) {
        return "Model 不存在或请求不被接受：请检查 AI_MODEL";
      }
      if (s === 429) {
        return "请求过于频繁，请稍后再试";
      }
      if (s >= 500) {
        return "Provider 错误：上游模型服务异常（HTTP " + s + "）";
      }
      return "请求失败（HTTP " + s + "）";
    }
  }
  return "未知错误：" + (err instanceof Error ? err.message : String(err));
}
