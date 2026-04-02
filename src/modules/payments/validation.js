import { z } from "zod";

const paystackMethodSchema = z.enum(["momo", "card"]);

export const processPaymentSchema = z.object({
  sale_id: z.uuid(),
  method: z.enum(["cash", "momo", "card"]),
  amount_paid: z.number().positive(),
  paystack_reference: z.string().min(6).optional(),
});

export const initializePaymentSchema = z.object({
  sale_id: z.uuid(),
  method: paystackMethodSchema,
  payer_phone: z.string().min(10).optional(),
});
