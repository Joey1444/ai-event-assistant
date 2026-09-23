import {
  copyFileSync,
  existsSync,
  readFileSync,
  renameSync,
  writeFileSync,
} from "fs";
import { join } from "path";

// 把 updates（key → value）写回项目根 .env：更新已有 key、追加新 key，保留注释/空行/无关 key。
export function upsertEnv(
  updates: Record<string, string>,
): Record<string, string> {
  const envPath = join(process.cwd(), ".env");
  const examplePath = join(process.cwd(), ".env.example");

  // .env 不存在时，从 .env.example 复制一份作底子
  if (!existsSync(envPath) && existsSync(examplePath)) {
    copyFileSync(examplePath, envPath);
  }

  const content = existsSync(envPath) ? readFileSync(envPath, "utf8") : "";
  const lines = content.split(/\r?\n/);

  const remaining = new Map(Object.entries(updates));
  const out: string[] = [];
  const finalValues: Record<string, string> = {};

  for (const line of lines) {
    const m = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m && remaining.has(m[1])) {
      const value = remaining.get(m[1])!;
      out.push(`${m[1]}=${formatEnvValue(value)}`);
      finalValues[m[1]] = value;
      remaining.delete(m[1]);
    } else {
      out.push(line);
      if (m) finalValues[m[1]] = parseEnvValue(m[2]);
    }
  }

  // 未匹配到的 key 追加到末尾
  for (const [key, value] of remaining) {
    out.push(`${key}=${formatEnvValue(value)}`);
    finalValues[key] = value;
  }

  // 原子写入：先写临时文件再 rename，避免写一半崩溃
  const tmpPath = `${envPath}.tmp`;
  writeFileSync(tmpPath, out.join("\n") + "\n", "utf8");
  renameSync(tmpPath, envPath);
  return finalValues;
}

// 解析 .env 里一个 value：去首尾空格、去双引号、还原转义。
function parseEnvValue(raw: string): string {
  const trimmed = raw.trim();
  if (trimmed.startsWith('"') && trimmed.endsWith('"')) {
    const inner = trimmed.slice(1, -1);
    return inner
      .replace(/\\n/g, "\n")
      .replace(/\\"/g, '"')
      .replace(/\\\\/g, "\\");
  }
  return trimmed;
}

// 值含空格 / # / 双引号 / 换行时，用双引号包裹并转义（防 .env 注入）。
function formatEnvValue(value: string): string {
  if (!/[ #"\r\n]/.test(value)) return value;
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\r?\n/g, "\\n");
  return `"${escaped}"`;
}

// 把 key 掩码成「****末4位」，用于前端提示，绝不暴露明文。
export function maskKey(key: string): string {
  if (!key) return "";
  return key.length > 4 ? `****${key.slice(-4)}` : "****";
}
