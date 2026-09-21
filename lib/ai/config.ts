import "server-only";

// AI 配置：文本模型经 CCSwitch 网关访问；文生图直连第三方 DashScope 原生 API。
export const aiConfig = {
  baseURL: process.env.AI_BASE_URL ?? "http://127.0.0.1:15721",
  apiKey: process.env.AI_API_KEY ?? "cc-switch-local",
  model: process.env.AI_MODEL ?? "deepseek-v4-pro",
  timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 60000),
  maxTokens: toNumber(process.env.AI_MAX_TOKENS, 50000),
};

// 文生图：直连第三方 DashScope 原生 API（与 CCSwitch 无关）。
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
