import "server-only";

// AI 配置：文本模型直连 DeepSeek 官方 API；文生图直连第三方 DashScope 原生 API。
export const aiConfig = {
  baseURL: process.env.AI_BASE_URL ?? "https://api.deepseek.com",
  apiKey: process.env.AI_API_KEY ?? "",
  model: process.env.AI_MODEL ?? "deepseek-v4-pro",
  timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 60000),
  maxTokens: toNumber(process.env.AI_MAX_TOKENS, 300000),
};

// 文生图：直连第三方 DashScope 原生 API。
export const imageConfig = {
  baseURL: process.env.IMAGE_API_BASE_URL ?? "",
  apiKey: process.env.IMAGE_API_KEY ?? "",
  model: process.env.IMAGE_MODEL ?? "",
  timeoutMs: toNumber(process.env.IMAGE_TIMEOUT_MS, 180000),
};

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
