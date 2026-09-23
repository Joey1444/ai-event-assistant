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

// AI 网关配置（文本 / 文生图两套）：baseURL 限 http(s)、model 非空禁空格、apiKey 禁换行（允许空串=不修改）
const baseUrlSchema = z
  .string()
  .trim()
  .refine(
    (u) => u === "" || /^https?:\/\/\S+$/i.test(u),
    "请输入合法的 http/https 地址（留空则不修改）",
  );

const modelSchema = z
  .string()
  .trim()
  .min(1, "模型名不能为空")
  .max(200)
  .regex(/^\S+$/, "模型名不能含空格或换行");

const apiKeySchema = z
  .string()
  .trim()
  .max(500)
  .regex(/^[^\r\n\t]*$/, "API Key 不能含换行或制表符");

export const aiConfigSchema = z.object({
  text: z.object({
    baseUrl: baseUrlSchema,
    model: modelSchema,
    apiKey: apiKeySchema,
  }),
  image: z.object({
    baseUrl: baseUrlSchema,
    model: modelSchema,
    apiKey: apiKeySchema,
  }),
});
