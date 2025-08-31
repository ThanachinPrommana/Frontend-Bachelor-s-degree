import { z } from "zod";

export const registerSchema = z.object({
  First_name: z.string().min(1, "กรุณากรอกชื่อ"),
  Last_name: z.string().min(1, "กรุณากรอกนามสกุล"),
  Email: z
    .string()
    .min(1, "กรุณากรอกอีเมล")
    .email("รูปแบบอีเมลไม่ถูกต้อง"),
  Phone: z
    .string()
    .min(9, "เบอร์โทรศัพท์ต้องมี 9–10 หลัก")
    .max(10, "เบอร์โทรศัพท์ต้องมี 9–10 หลัก")
    .regex(/^[0-9]+$/, "เบอร์โทรศัพท์ต้องเป็นตัวเลขเท่านั้น"),
  Password: z.string().min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร"),
  ConfirmPassword: z.string(),
}).refine((data) => data.Password === data.ConfirmPassword, {
  path: ["ConfirmPassword"],
  message: "รหัสผ่านไม่ตรงกัน",
});
