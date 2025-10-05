import { z } from "zod";

export const resetPasswordSchema = z
  .object({
    Password: z
      .string()
      .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      .max(72, "รหัสผ่านยาวเกินไป"),
    ConfirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),
  })
  .refine((data) => data.Password === data.ConfirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["ConfirmPassword"],
  });
