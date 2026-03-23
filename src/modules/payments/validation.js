import { z } from "zod";

export const processPaymentSchema = z.object({
  sale_id: z.uuid(),
  method: z.enum(["cash", "momo", "card"]),
  amount_paid: z.number().positive(),
  payer_phone: z.string().min(10).optional(),
});
