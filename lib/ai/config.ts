import "server-only";

// AI 配置：文本模型直连 DeepSeek 官方 API；文生图直连第三方 DashScope 原生 API。
// 每次调用动态读 process.env（不缓存），让写入 .env 后 next dev 热重载能立即生效。
export function getAiConfig() {
  return {
    baseURL: process.env.EP_AI_BASE_URL ?? "https://api.deepseek.com",
    apiKey: process.env.EP_AI_API_KEY ?? "",
    model: process.env.EP_AI_MODEL ?? "deepseek-v4-pro",
    timeoutMs: toNumber(process.env.EP_AI_TIMEOUT_MS, 60000),
    maxTokens: toNumber(process.env.EP_AI_MAX_TOKENS, 300000),
  };
}

// 文生图：直连第三方 DashScope 原生 API。
export function getImageConfig() {
  return {
    baseURL: process.env.EP_IMAGE_API_BASE_URL ?? "",
    apiKey: process.env.EP_IMAGE_API_KEY ?? "",
    model: process.env.EP_IMAGE_MODEL ?? "wan2.7-image-pro",
    timeoutMs: toNumber(process.env.EP_IMAGE_TIMEOUT_MS, 180000),
  };
}

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
