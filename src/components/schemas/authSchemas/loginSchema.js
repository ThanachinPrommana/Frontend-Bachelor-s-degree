import { z } from "zod";

export const loginSchema = z.object({
  Email: z.string().min(1, "กรุณากรอกอีเมล").email("รูปแบบอีเมลไม่ถูกต้อง"),
  Password: z.string().min(1, "กรุณากรอกรหัสผ่าน"),
});
