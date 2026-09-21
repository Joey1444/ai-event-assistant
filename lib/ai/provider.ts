// AI Provider 抽象层：业务代码只调用 generateText() / generateImage()，不关心底层实现。
// 文本模型经 CCSwitch 网关（Anthropic 兼容 /v1/messages）；文生图直连第三方（OpenAI 兼容 /v1/images/generations）。
import "server-only";
import { aiConfig, imageConfig } from "./config";

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

export type GenerateImageOptions = {
  prompt: string;
  initImage?: string; // 图生图：上一张图的裸 base64（不含 data: 前缀）
  size?: string;
  model?: string;
  timeoutMs?: number;
};

export type GenerateImageResult = {
  dataUrl: string;
};

// 文生图 / 图生图：直连第三方 OpenAI 兼容 /images/generations（不走 CCSwitch）。
// baseURL 需填到版本段为止（含 /v1 或 /compatible-mode/v1），代码只拼 /images/generations。
export async function generateImage({
  prompt,
  initImage,
  size,
  model,
  timeoutMs,
}: GenerateImageOptions): Promise<GenerateImageResult> {
  const baseURL = imageConfig.baseURL;
  const apiKey = imageConfig.apiKey;
  const m = model ?? imageConfig.model;
  if (!baseURL || !apiKey || !m) {
    throw new AiError({
      kind: "unknown",
      message:
        "未配置文生图服务：请在 .env 里设置 IMAGE_API_BASE_URL / IMAGE_API_KEY / IMAGE_MODEL",
    });
  }

  // 非本机地址必须 https，避免 Bearer key 明文传输
  const isLocal =
    baseURL.startsWith("http://localhost") || baseURL.startsWith("http://127.0.0.1");
  if (!baseURL.startsWith("https://") && !isLocal) {
    throw new AiError({
      kind: "unknown",
      message: "IMAGE_API_BASE_URL 必须是 https 地址（本机回环地址除外）",
    });
  }

  const body: Record<string, unknown> = {
    model: m,
    prompt,
    n: 1,
    response_format: "b64_json",
  };
  if (size) body.size = size;
  if (initImage) {
    // 图生图：按 OpenAI gpt-image-1 语义；若你的服务字段不同，改这里即可。
    body.image = [{ type: "input_image", b64_json: initImage }];
  }

  const timeout = timeoutMs ?? imageConfig.timeoutMs;
  let res: Response;
  try {
    res = await fetch(`${baseURL.replace(/\/+$/, "")}/images/generations`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(body),
      signal: AbortSignal.timeout(timeout),
    });
  } catch (err) {
    const e = err as Error & { cause?: { code?: string } };
    const code = e?.cause?.code ?? "";
    if (e?.name === "AbortError" || e?.name === "TimeoutError") {
      throw new AiError({ kind: "timeout", message: "文生图请求超时" });
    }
    throw new AiError({ kind: "network", message: e.message, causeCode: code });
  }

  if (!res.ok) {
    const raw = await res.text().catch(() => "");
    throw new AiError({ kind: "http", message: raw, status: res.status });
  }

  const data = (await res.json()) as {
    data?: Array<{ b64_json?: string }>;
  };
  const first = data.data?.[0];
  const b64 = first?.b64_json;
  if (!b64 || typeof b64 !== "string" || b64.length === 0) {
    throw new AiError({ kind: "unknown", message: "文生图服务未返回图片，请稍后重试" });
  }

  const mime = sniffImageMime(b64);
  return { dataUrl: `data:${mime};base64,${b64}` };
}

// 从 base64 前几个字节嗅探图片类型，只放行 png/jpeg/webp（拒绝 svg 等可执行内容）。
function sniffImageMime(base64: string): string {
  // 先按 base64 长度粗估，避免把超大响应整体解码进内存
  if (base64.length > (8 * 1024 * 1024 * 4) / 3) {
    throw new AiError({ kind: "unknown", message: "文生图返回的图片过大" });
  }
  const bytes = Buffer.from(base64, "base64");
  if (bytes.length > 8 * 1024 * 1024) {
    throw new AiError({ kind: "unknown", message: "文生图返回的图片过大" });
  }
  if (
    bytes.length >= 8 &&
    bytes[0] === 0x89 &&
    bytes[1] === 0x50 &&
    bytes[2] === 0x4e &&
    bytes[3] === 0x47
  ) {
    return "image/png";
  }
  if (bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) {
    return "image/jpeg";
  }
  if (
    bytes.length >= 12 &&
    bytes.toString("ascii", 0, 4) === "RIFF" &&
    bytes.toString("ascii", 8, 12) === "WEBP"
  ) {
    return "image/webp";
  }
  throw new AiError({ kind: "unknown", message: "文生图服务返回了不支持的图片格式" });
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
    if (err.kind === "unknown" && err.message && err.message !== "unknown") {
      return err.message;
    }
  }
  return "操作失败，请重试一次";
}
