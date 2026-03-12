import { z } from "zod";

export const registerSchema = z.object({
  name: z.string().min(2),
  email: z.email(), // Use top-level z.email()
  password: z.string().min(6),
  role: z.enum(["admin", "manager", "cashier"]),
});

export const loginSchema = z.object({
  email: z.email(), // Use top-level z.email()
  password: z.string().min(6),
});
