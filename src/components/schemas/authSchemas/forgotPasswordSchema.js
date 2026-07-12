import { z } from "zod";

export const forgotPasswordSchema = z.object({
  Email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง"),
});
