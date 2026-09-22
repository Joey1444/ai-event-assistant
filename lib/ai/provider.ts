// AI Provider 抽象层：业务代码只调用 generateText() / generateImage()，不关心底层实现。
// 文本模型直连 DeepSeek（OpenAI 兼容 /chat/completions）；文生图直连第三方（DashScope 原生 API）。
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

  if (!aiConfig.baseURL || !aiConfig.apiKey || !m) {
    throw new AiError({
      kind: "unknown",
      message:
        "未配置文本模型：请在 .env 里设置 AI_BASE_URL / AI_API_KEY / AI_MODEL",
    });
  }

  let res: Response;
  try {
    res = await fetch(`${aiConfig.baseURL.replace(/\/+$/, "")}/chat/completions`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${aiConfig.apiKey}`,
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
    choices?: Array<{
      message?: { content?: string };
      finish_reason?: string | null;
    }>;
  };
  if (data.choices?.[0]?.finish_reason === "length") {
    throw new AiError({
      kind: "truncated",
      message: "输出被截断（达到 max_tokens 上限）",
    });
  }
  return data.choices?.[0]?.message?.content ?? "";
}

export type GenerateImageOptions = {
  prompt: string;
  images?: string[]; // 参考图（data URL），可多张，作为 content 里的 image 输入
  size?: string;
  model?: string;
  timeoutMs?: number;
};

export type GenerateImageResult = {
  dataUrl: string;
};

// 文生图 / 图生图：直连 DashScope 原生 API（通义万相 wan 系列）。
// baseURL 填到 api 版本段为止（如 https://maas.qianwenaiapi.com/api/v1），代码拼 /services/aigc/multimodal-generation/generation。
export async function generateImage({
  prompt,
  images,
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

  // DashScope 原生：content 数组里放 image（参考图，可多张）与 text（提示词）
  const content: Array<{ text?: string; image?: string }> = [];
  if (images) {
    for (const img of images) content.push({ image: img });
  }
  content.push({ text: prompt });

  const body: Record<string, unknown> = {
    model: m,
    input: { messages: [{ role: "user", content }] },
    parameters: {},
  };
  if (size) (body.parameters as Record<string, unknown>).size = size;

  const timeout = timeoutMs ?? imageConfig.timeoutMs;
  let res: Response;
  try {
    res = await fetch(
      `${baseURL.replace(/\/+$/, "")}/services/aigc/multimodal-generation/generation`,
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(body),
        signal: AbortSignal.timeout(timeout),
      },
    );
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
    output?: {
      choices?: Array<{ message?: { content?: Array<{ image?: string }> } }>;
    };
  };
  const image = data.output?.choices?.[0]?.message?.content?.find(
    (c) => typeof c.image === "string" && c.image.length > 0,
  )?.image;
  if (!image) {
    throw new AiError({ kind: "unknown", message: "文生图服务未返回图片，请稍后重试" });
  }

  return { dataUrl: await imageToDataUrl(image, timeout) };
}

// 把 API 返回的 image（data URL 或 URL）统一转成经过魔数 + 大小校验的 data URL。
async function imageToDataUrl(image: string, timeoutMs: number): Promise<string> {
  let base64: string;
  if (image.startsWith("data:image/")) {
    const idx = image.indexOf(";base64,");
    if (idx < 0) {
      throw new AiError({ kind: "unknown", message: "文生图返回的图片格式无法识别" });
    }
    base64 = image.slice(idx + ";base64,".length);
  } else if (image.startsWith("http://") || image.startsWith("https://")) {
    const imgRes = await fetch(image, { signal: AbortSignal.timeout(timeoutMs) });
    if (!imgRes.ok) {
      throw new AiError({ kind: "unknown", message: "下载文生图结果失败" });
    }
    base64 = Buffer.from(await imgRes.arrayBuffer()).toString("base64");
  } else {
    throw new AiError({ kind: "unknown", message: "文生图返回了无法识别的图片" });
  }

  const mime = sniffImageMime(base64);
  return `data:${mime};base64,${base64}`;
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

// 轻量健康检查：只要网关有响应（哪怕 404），就认为 AI 服务在运行
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
