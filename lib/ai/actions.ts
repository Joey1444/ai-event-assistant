"use server";

import { generateText, classifyError } from "./provider";
import { upsertEnv, maskKey } from "../env";
import { aiConfigSchema } from "../validation";

export type AiTestResult =
  | { ok: true; text: string }
  | { ok: false; error: string };

export async function testAi(): Promise<AiTestResult> {
  try {
    const text = await generateText({
      messages: [{ role: "user", content: "请回复：AI connection successful." }],
    });
    return { ok: true, text };
  } catch (err) {
    return { ok: false, error: classifyError(err) };
  }
}

export type AiConfigInput = {
  text: { baseUrl: string; model: string; apiKey: string };
  image: { baseUrl: string; model: string; apiKey: string };
  tavilyKey: string;
};

export type SaveAiConfigResult =
  | { ok: true; hint: { text: string; image: string; tavily: string } }
  | { ok: false; error: string };

export async function saveAiConfig(
  input: AiConfigInput,
): Promise<SaveAiConfigResult> {
  const parsed = aiConfigSchema.safeParse(input);
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("；");
    return { ok: false, error: msg || "配置格式不正确" };
  }

  const { text, image, tavilyKey } = parsed.data;
  const updates: Record<string, string> = {};
  // 字段留空 = 保留现有值，不覆盖
  if (text.baseUrl) updates.EP_AI_BASE_URL = text.baseUrl;
  if (text.model) updates.EP_AI_MODEL = text.model;
  if (text.apiKey) updates.EP_AI_API_KEY = text.apiKey;
  if (image.baseUrl) updates.EP_IMAGE_API_BASE_URL = image.baseUrl;
  if (image.model) updates.EP_IMAGE_MODEL = image.model;
  if (image.apiKey) updates.EP_IMAGE_API_KEY = image.apiKey;
  if (tavilyKey) updates.EP_TAVILY_API_KEY = tavilyKey;

  try {
    // upsertEnv 返回写回后的最终值，用其准确计算掩码（不回传明文）
    const finalValues = upsertEnv(updates);
    return {
      ok: true,
      hint: {
        text: maskKey(finalValues.EP_AI_API_KEY ?? ""),
        image: maskKey(finalValues.EP_IMAGE_API_KEY ?? ""),
        tavily: maskKey(finalValues.EP_TAVILY_API_KEY ?? ""),
      },
    };
  } catch {
    return { ok: false, error: "写入 .env 失败，请检查文件权限" };
  }
}
