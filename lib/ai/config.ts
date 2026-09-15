// AI 网关统一配置：本项目通过 CCSwitch 访问模型，不直接持有任何 Provider 的 Key
export const aiConfig = {
  baseURL: process.env.AI_BASE_URL ?? "http://127.0.0.1:15721",
  apiKey: process.env.AI_API_KEY ?? "cc-switch-local",
  model: process.env.AI_MODEL ?? "deepseek-v4-pro",
  timeoutMs: toNumber(process.env.AI_TIMEOUT_MS, 60000),
  maxTokens: toNumber(process.env.AI_MAX_TOKENS, 2048),
};

function toNumber(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}
