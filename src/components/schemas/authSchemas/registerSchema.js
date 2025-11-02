import { z } from "zod";

const digitsOnly = (s) => (s || "").replace(/\D/g, "");

const isThaiId = (id) => {
  const value = digitsOnly(String(id || ""));
  if (!/^\d{13}$/.test(value)) return false;
  const d = value.split("").map(Number);
  const sum = d.slice(0, 12).reduce((acc, x, i) => acc + x * (13 - i), 0);
  const check = (11 - (sum % 11)) % 10;
  return check === d[12];
};

export const registerSchema = z
  .object({
    First_name: z.string().trim().min(1, "กรุณากรอกชื่อ"),
    Last_name: z.string().trim().min(1, "กรุณากรอกนามสกุล"),

    Email: z.string().trim().toLowerCase().email("อีเมลไม่ถูกต้อง"),

    // ✅ เบอร์โทร: ตัวเลขเท่านั้น 9–10 หลัก
    Phone: z
      .string()
      .transform(digitsOnly)
      .refine((v) => v.length >= 9 && v.length <= 10, "เบอร์โทรไม่ถูกต้อง"),

    Password: z
      .string()
      .min(6, "รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร")
      .max(72, "รหัสผ่านยาวเกินไป"),
    ConfirmPassword: z.string().min(1, "กรุณายืนยันรหัสผ่าน"),

    // ✅ บัตรประชาชน 13 หลัก ตรวจ checksum
    nationalId: z
      .string({ required_error: "กรุณากรอกเลขบัตรประชาชน" })
      .transform(digitsOnly)
      .refine((v) => /^\d{13}$/.test(v), "อนุญาตเฉพาะตัวเลข 13 หลัก")
      .refine(isThaiId, "เลขบัตรประชาชนไม่ถูกต้อง"),

    // ✅ ที่อยู่ตามบัตร
    regAddress: z.object({
      // ต้องกรอก
      houseNo: z.string().trim().min(1, "กรุณากรอกเลขที่บ้าน"),
      subdistrict: z.string().trim().min(1, "กรุณากรอกตำบล"),
      district: z.string().trim().min(1, "กรุณากรอกอำเภอ"),
      province: z.string().trim().min(1, "กรุณากรอกจังหวัด"),

      // ไม่บังคับ
      village: z.string().trim().max(200).optional().default(""),
      alley: z.string().trim().max(200).optional().default(""),
      road: z.string().trim().max(200).optional().default(""),
    }),
  })
  // ✅ ตรวจรหัสผ่านตรงกัน
  .refine((data) => data.Password === data.ConfirmPassword, {
    message: "รหัสผ่านไม่ตรงกัน",
    path: ["ConfirmPassword"],
  });
