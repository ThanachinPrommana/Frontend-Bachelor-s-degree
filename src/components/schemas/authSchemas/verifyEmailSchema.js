import { z } from "zod";

export const verifyEmailSchema = z.object({
  // ตัวเลข
  Monthly_Income: z.coerce.number().min(0, "รายได้ต่อเดือนต้องเป็นเลขไม่ติดลบ"),

  Family_Size: z.coerce
    .number()
    .int("จำนวนสมาชิกครอบครัวต้องเป็นจำนวนเต็ม")
    .min(1, "กรุณากรอกจำนวนสมาชิกครอบครัว (อย่างน้อย 1 คน)"),

  // จังหวัด/อำเภอ/ตำบล (ตาม UI ยังบังคับทั้งหมด)
  Preferred_Province: z.string().trim().min(1, "กรุณาเลือกจังหวัด"),
  Preferred_District: z.string().trim().min(1, "กรุณาเลือกอำเภอ/เขต"),
  Preferred_Subdistrict: z.string().trim().min(1, "กรุณาเลือกตำบล/แขวง"),

  // Dropdown ต่าง ๆ (บังคับใน UI)
  Parking_Needs: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกความต้องการที่จอดรถ"),

  // 🔻 แก้ไขตรงนี้
  Nearby_Facilities: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกสิ่งอำนวยความสะดวกใกล้เคียง"),

  // 🔻 แก้ไขตรงนี้
  Lifestyle_Preferences: z
    .string()
    .trim()
    .min(1, "กรุณาเลือกรูปแบบการใช้ชีวิต"),

  // ข้อความอิสระ (ไม่บังคับ)
  Special_Requirements: z
    .string()
    .trim()
    .max(1000, "ความต้องการพิเศษยาวเกินไป")
    .optional(),
});
