// 在线演示的每日调用上限。公网上任何拿到链接的人都能触发 AI 调用，
// 消耗的是部署者自己的额度，所以给一个全局日上限兜底，防止被刷爆。
// 本地运行（未设 EP_PUBLIC_MODE）不生效。
import { isPublicMode } from "../publicMode";

const DEFAULT_DAILY_LIMIT = 300;

let day = "";
let used = 0;

function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

function dailyLimit(): number {
  const n = Number.parseInt(process.env.EP_DAILY_CALL_LIMIT ?? "", 10);
  return Number.isFinite(n) && n > 0 ? n : DEFAULT_DAILY_LIMIT;
}

export type QuotaResult = { ok: true } | { ok: false; error: string };

// 每次真正调用模型前先占一个额度
export function acquireAiQuota(): QuotaResult {
  if (!isPublicMode()) return { ok: true };

  const d = todayKey();
  if (d !== day) {
    day = d;
    used = 0;
  }
  if (used >= dailyLimit()) {
    return {
      ok: false,
      error:
        "今日在线演示额度已用完。可下载项目在本地运行，体验完整流程。",
    };
  }
  used += 1;
  return { ok: true };
}
