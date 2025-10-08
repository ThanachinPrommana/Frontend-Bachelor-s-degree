import { z } from "zod";

export const registerSchema = z
  .object({
    First_name: z.string().trim().min(1, "กรุณากรอกชื่อ"),
    Last_name: z.string().trim().min(1, "กรุณากรอกนามสกุล"),
    Email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง"),
    Phone: z
      .string()
      .trim()
      .min(9, "เบอร์โทรไม่ถูกต้อง")
      .max(20, "เบอร์โทรไม่ถูกต้อง"),
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
