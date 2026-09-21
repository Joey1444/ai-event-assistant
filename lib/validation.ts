// 服务端 action 的输入校验（Zod）。所有来自客户端的入参在这里过一道，
// 防止伪造请求污染状态、写入 NaN、超长或畸形数据。
import { z } from "zod";

export const idSchema = z.string().min(1).max(100);

export const approvalDecisionSchema = z.enum([
  "APPROVED",
  "REJECTED",
  "REVISION_REQUIRED",
]);

export const budgetItemSchema = z.object({
  category: z.string().max(50),
  item: z.string().max(200),
  quantity: z.number().finite().nonnegative().max(1_000_000),
  unit: z.string().max(20),
  unitPrice: z.number().finite().nonnegative().max(1_000_000_000),
  notes: z.string().max(2000),
  source: z.string().max(50),
  confidence: z.string().max(20),
});

export const budgetItemsSchema = z.array(budgetItemSchema).max(500);

export const contentSchema = z.record(z.string(), z.string().max(50_000));

export const projectTextFieldSchema = z.string().trim().min(1).max(200);

export const editInstructionSchema = z.string().trim().min(1).max(2000);
