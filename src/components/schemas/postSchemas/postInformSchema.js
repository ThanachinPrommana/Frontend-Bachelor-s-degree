import { z } from "zod";

const urlOrEmpty = z.string().url("กรุณากรอกลิงก์ให้ถูกต้อง").or(z.literal("")).optional();

const phoneSchema = z
  .string()
  .min(9, "กรุณากรอกเบอร์โทรอย่างน้อย 9 หลัก")
  .max(15, "เบอร์โทรไม่ควรเกิน 15 หลัก")
  .regex(/^[0-9+\-\s()]+$/, "รูปแบบเบอร์โทรไม่ถูกต้อง");

export const postInformSchema = z.object({
  Name: z.string().min(2, "กรุณากรอกชื่ออย่างน้อย 2 ตัวอักษร"),
  Phone: phoneSchema,
  Link_line: urlOrEmpty,      
  Link_facbook: urlOrEmpty,   
  Contract_Seller: z.string().optional(), 
});
