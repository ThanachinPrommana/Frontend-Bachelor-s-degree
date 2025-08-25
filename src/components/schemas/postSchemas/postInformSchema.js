import { z } from "zod";

// อนุญาตให้เป็น "" ได้ สำหรับฟิลด์ลิงก์ (บางคนยังไม่ใส่)
const urlOrEmpty = z.string().url("กรุณากรอกลิงก์ให้ถูกต้อง").or(z.literal("")).optional();

// เบอร์โทรแบบยืดหยุ่น: 9–15 หลัก (คุณจะใช้ regex ไทยเฉพาะก็ได้)
const phoneSchema = z
  .string()
  .min(9, "กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก")
  .max(15, "เบอร์โทรไม่ควรเกิน 15 หลัก")
  .regex(/^[0-9+\-\s()]+$/, "รูปแบบเบอร์โทรไม่ถูกต้อง");

export const postInformSchema = z.object({
  Name: z.string().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร"),
  Phone: phoneSchema,
  Link_line: urlOrEmpty,      // ตัวอย่าง: https://line.me/ti/p/xxxx หรือปล่อยว่าง
  Link_facbook: urlOrEmpty,   // ตัวอย่าง: https://facebook.com/username หรือว่าง
  Contract_Seller: z.string().optional(), // ข้อตกลง/เงื่อนไขผู้ขาย ถ้ามี
});
