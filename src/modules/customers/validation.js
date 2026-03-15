import { z } from "zod";

export const createCustomerSchema = z.object({
  name: z.string().min(2),
  phone: z.string().optional(),
  email: z.email().optional(),
});

export const updateCustomerSchema = z.object({
  name: z.string().min(2).optional(),
  phone: z.string().optional(),
  email: z.email().optional(),
  loyalty_points: z.number().int().optional(),
});
