import { z } from "zod";

export const forgotPasswordSchema = z.object({
  Email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
});
