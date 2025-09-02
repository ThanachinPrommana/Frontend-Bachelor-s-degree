import { z } from "zod";

export const resetPasswordSchema = z.object({
  Password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  ConfirmPassword: z.string(),
}).refine((data) => data.Password === data.ConfirmPassword, {
  path: ["ConfirmPassword"],
  message: "รหัสผ่านไม่ตรงกัน",
});
