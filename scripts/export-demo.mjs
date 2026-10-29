// 把本地 dev.db 里的示例项目导出成 prisma/demo-seed.json，供部署时自动导入。
// 仅本地使用：node scripts/export-demo.mjs [projectId]
//
// 海报图片会先用 ffmpeg 压到宽 512 的 JPEG 再内联，否则原始 base64 有十几 MB。
import { execFileSync } from "node:child_process";
import { mkdtempSync, rmSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { PrismaClient } from "@prisma/client";

const here = dirname(fileURLToPath(import.meta.url));
const outPath = join(here, "..", "prisma", "demo-seed.json");

process.env.EP_DATABASE_URL ??= "file:./dev.db";
const prisma = new PrismaClient();

const targetId = process.argv[2];

const project = targetId
  ? await prisma.project.findUnique({ where: { id: targetId } })
  : await prisma.project.findFirst({
      where: { status: "HUMAN_DECISION_COMPLETED" },
      orderBy: { updatedAt: "desc" },
    });

if (!project) {
  console.error("找不到可导出的项目");
  process.exit(1);
}

const id = project.id;
const full = await prisma.project.findUnique({
  where: { id },
  include: {
    brief: true,
    analyses: { orderBy: { createdAt: "asc" } },
    researchItems: { orderBy: { createdAt: "asc" } },
    facts: { orderBy: { createdAt: "asc" } },
    concepts: { orderBy: { variant: "asc" } },
    critiques: { orderBy: { createdAt: "asc" } },
    decisions: { orderBy: { createdAt: "asc" } },
    plans: { orderBy: { version: "asc" } },
    budgets: { orderBy: { version: "asc" }, include: { items: true } },
    copies: { orderBy: { version: "asc" } },
    posters: { orderBy: { version: "asc" } },
    posterImages: { orderBy: { version: "asc" } },
    finalQas: { orderBy: { version: "asc" } },
    approvals: true,
  },
});

const workDir = mkdtempSync(join(tmpdir(), "demo-seed-"));
const posterImages = [];
let seq = 0;

for (const img of full.posterImages) {
  const m = img.imageDataUrl.match(/^data:image\/[a-z]+;base64,(.+)$/);
  if (!m) continue;
  const inFile = join(workDir, `in-${seq}.img`);
  const outFile = join(workDir, `out-${seq}.jpg`);
  writeFileSync(inFile, Buffer.from(m[1], "base64"));
  try {
    execFileSync(
      "ffmpeg",
      ["-y", "-loglevel", "error", "-i", inFile, "-vf", "scale='min(512,iw)':-2", "-q:v", "5", outFile],
      { stdio: "pipe" },
    );
    const b64 = readFileSync(outFile).toString("base64");
    posterImages.push({
      ...img,
      imageDataUrl: `data:image/jpeg;base64,${b64}`,
    });
    console.log(`  图片 v${img.version}: ${(img.imageDataUrl.length / 1024).toFixed(0)}KB → ${(b64.length / 1024).toFixed(0)}KB`);
  } catch (err) {
    console.warn(`  图片 v${img.version} 压缩失败，已跳过：${err.message}`);
  }
  seq += 1;
}

rmSync(workDir, { recursive: true, force: true });

// 所有产出（方案/预算/文案/海报/QA）都在，只差最终人工审批 —— 状态据实标为「待最终审批」
const seed = {
  _note: "由 scripts/export-demo.mjs 从本地数据库导出，部署时由 prisma/seed-demo.mjs 导入",
  project: {
    id: full.id,
    projectName: full.projectName,
    organization: full.organization,
    status: full.finalQas.length > 0 ? "FINAL_REVIEW" : full.status,
    createdAt: full.createdAt,
    updatedAt: full.updatedAt,
  },
  brief: full.brief,
  analyses: full.analyses,
  researchItems: full.researchItems,
  facts: full.facts,
  concepts: full.concepts,
  critiques: full.critiques,
  decisions: full.decisions,
  plans: full.plans,
  budgets: full.budgets,
  copies: full.copies,
  posters: full.posters,
  posterImages,
  finalQas: full.finalQas,
  approvals: full.approvals,
};

writeFileSync(outPath, JSON.stringify(seed, null, 2), "utf8");
const counts = Object.entries(seed)
  .filter(([, v]) => Array.isArray(v))
  .map(([k, v]) => `${k}=${v.length}`)
  .join(" ");
console.log(`已导出 → ${outPath}`);
console.log(`  ${counts}`);
console.log(`  文件大小 ${(readFileSync(outPath).length / 1024).toFixed(0)}KB`);

await prisma.$disconnect();
