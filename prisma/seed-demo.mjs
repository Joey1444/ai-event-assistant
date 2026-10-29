// 部署时把 prisma/demo-seed.json 导入数据库，让评委打开就能看到一份完整的策划产出。
// 幂等：项目已存在就跳过。种子导入失败不阻断服务启动。
import { PrismaClient } from "@prisma/client";
import { existsSync, readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const seedPath = join(here, "demo-seed.json");

if (process.env.EP_SEED_DEMO === "0") {
  console.log("[seed] EP_SEED_DEMO=0，跳过示例项目导入");
  process.exit(0);
}

if (!existsSync(seedPath)) {
  console.log("[seed] 未找到 demo-seed.json，跳过");
  process.exit(0);
}

const prisma = new PrismaClient();

try {
  const seed = JSON.parse(readFileSync(seedPath, "utf8"));
  const projectId = seed.project.id;

  const existing = await prisma.project.findUnique({
    where: { id: projectId },
    select: { id: true },
  });
  if (existing) {
    console.log("[seed] 示例项目已存在，跳过");
  } else {
    await prisma.$transaction(async (tx) => {
      await tx.project.create({ data: seed.project });
      if (seed.brief) await tx.projectBrief.create({ data: seed.brief });

      for (const row of seed.analyses ?? []) await tx.pmAnalysis.create({ data: row });
      for (const row of seed.researchItems ?? []) await tx.researchItem.create({ data: row });
      for (const row of seed.facts ?? []) await tx.fact.create({ data: row });
      for (const row of seed.concepts ?? []) await tx.concept.create({ data: row });
      for (const row of seed.critiques ?? []) await tx.critique.create({ data: row });
      for (const row of seed.decisions ?? []) await tx.decision.create({ data: row });
      for (const row of seed.plans ?? []) await tx.activityPlan.create({ data: row });

      for (const budget of seed.budgets ?? []) {
        const { items, ...rest } = budget;
        await tx.budget.create({ data: rest });
        for (const item of items ?? []) await tx.budgetItem.create({ data: item });
      }

      for (const row of seed.copies ?? []) await tx.copy.create({ data: row });
      for (const row of seed.posters ?? []) await tx.poster.create({ data: row });
      for (const row of seed.posterImages ?? []) await tx.posterImage.create({ data: row });
      for (const row of seed.finalQas ?? []) await tx.finalQa.create({ data: row });
      for (const row of seed.approvals ?? []) await tx.approval.create({ data: row });
    });
    console.log(`[seed] 已导入示例项目：${seed.project.projectName}`);
  }
} catch (err) {
  console.error("[seed] 导入失败（不影响服务启动）：", err?.message ?? err);
} finally {
  await prisma.$disconnect();
}

process.exit(0);
