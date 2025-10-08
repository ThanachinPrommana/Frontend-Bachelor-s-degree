// src/components/schemas/authSchemas/verifyEmailSchema.js
import { z } from "zod";

const dateRegex = /^\d{4}-\d{2}-\d{2}$/; // YYYY-MM-DD

export const verifyEmailSchema = z.object({
  DateofBirth: z
    .string()
    .min(1, "กรุณาเลือกวันเกิด")
    .regex(dateRegex, "รูปแบบวันที่ไม่ถูกต้อง (YYYY-MM-DD)"),

  Occupation: z.string().trim().min(2, "กรุณากรอกอาชีพอย่างน้อย 2 ตัวอักษร"),

  Monthly_Income: z.coerce.number().min(0, "รายได้ต่อเดือนต้องเป็นเลขไม่ติดลบ"),

  Family_Size: z.coerce
    .number()
    .int("จำนวนสมาชิกครอบครัวต้องเป็นจำนวนเต็ม")
    .min(1, "กรุณากรอกจำนวนสมาชิกครอบครัว (อย่างน้อย 1 คน)"),

  // เก็บชื่อจังหวัด/อำเภอ/ตำบลเป็น string (ชื่อภาษาไทย) ให้ตรงกับที่หน้า UI ส่งขึ้น
  Preferred_Province: z.string().trim().min(1, "กรุณาเลือกจังหวัด"),

  Preferred_District: z.string().trim().min(1, "กรุณาเลือกอำเภอ/เขต"),

  Preferred_Subdistrict: z.string().trim().min(1, "กรุณาเลือกตำบล/แขวง"),

  Parking_Needs: z.enum(["oneCar", "twoCars", "Not_required"], {
    errorMap: () => ({ message: "กรุณาเลือกความต้องการที่จอดรถ" }),
  }),

  Nearby_Facilities: z.enum(
    ["BTS_MRT", "School", "Hospital", "Mall_Market", "Park_Nature"],
    { errorMap: () => ({ message: "กรุณาเลือกสิ่งอำนวยความสะดวกใกล้เคียง" }) }
  ),

  Lifestyle_Preferences: z.enum(
    ["Work_from_Home", "Have_Pets", "Need_a_Home_Office", "Like_Gardening"],
    { errorMap: () => ({ message: "กรุณาเลือกรูปแบบการใช้ชีวิต" }) }
  ),

  Special_Requirements: z
    .string()
    .trim()
    .max(1000, "ความต้องการพิเศษยาวเกินไป")
    .optional(),
});
