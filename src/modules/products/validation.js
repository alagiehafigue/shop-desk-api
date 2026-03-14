import { z } from "zod";

export const createProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive(),
  cost_price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  barcode: z.string().optional(),
  price: z.number().positive().optional(),
  cost_price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});
