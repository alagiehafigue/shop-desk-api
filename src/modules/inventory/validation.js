import { z } from "zod";

export const restockSchema = z.object({
  product_id: z.uuid(),
  quantity: z.number().int().positive(),
});

export const adjustmentSchema = z.object({
  product_id: z.uuid(),
  quantity: z.number().int(),
  reason: z.string().min(3),
});
