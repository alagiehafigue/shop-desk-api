import { z } from "zod";

const barcodeSchema = z.preprocess(
  (value) => {
    if (typeof value !== "string") {
      return value;
    }

    const normalized = value.trim().toUpperCase();

    return normalized === "" ? undefined : normalized;
  },
  z
    .string()
    .min(6, "Barcode must be at least 6 characters")
    .max(32, "Barcode must be 32 characters or fewer")
    .regex(/^[A-Z0-9-]+$/, "Barcode can only contain letters, numbers, and hyphens")
    .optional(),
);

export const createProductSchema = z.object({
  name: z.string().min(2),
  category: z.string().optional(),
  barcode: barcodeSchema,
  price: z.number().positive(),
  cost_price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});

export const updateProductSchema = z.object({
  name: z.string().min(2).optional(),
  category: z.string().optional(),
  barcode: barcodeSchema,
  price: z.number().positive().optional(),
  cost_price: z.number().positive().optional(),
  stock_quantity: z.number().int().nonnegative().optional(),
});
