import { z } from "zod";

export const processPaymentSchema = z.object({
  sale_id: z.uuid(),
  method: z.enum(["cash", "momo", "card"]),
  amount_paid: z.number().positive(),
  payer_phone: z.string().min(10).optional(),
  card_auth_code: z.string().min(4).optional(),
  card_holder_name: z.string().min(2).optional(),
  card_last4: z.string().regex(/^\d{4}$/).optional(),
});
