import { z } from "zod";

export const createSaleSchema = z.object({
  customer_id: z.uuid().nullable().optional(),
  discount: z.number().nonnegative().default(0),
  tax: z.number().nonnegative().default(0),
  payment_method: z.enum(["cash", "momo", "card"]).optional(),
  items: z
    .array(
      z.object({
        product_id: z.uuid(),
        quantity: z.number().int().positive(),
      }),
    )
    .min(1),
});
