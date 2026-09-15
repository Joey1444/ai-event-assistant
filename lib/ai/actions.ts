"use server";

import { generateText, classifyError } from "./provider";

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
