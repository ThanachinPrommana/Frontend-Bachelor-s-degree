import { z } from "zod";

export const verifyEmailSchema = z.object({
  DateofBirth: z.string().min(1, "กรุณากรอกวันเกิด"),
  Occupation: z.string().min(1, "กรุณากรอกอาชีพ"),
  Monthly_Income: z
    .number({ invalid_type_error: "รายได้ต้องเป็นตัวเลข" })
    .positive("กรุณากรอกรายได้ต่อเดือน"),
  Family_Size: z
    .number({ invalid_type_error: "จำนวนสมาชิกครอบครัวต้องเป็นตัวเลข" })
    .min(1, "กรุณากรอกจำนวนสมาชิกครอบครัว"),
  Preferred_Province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  Preferred_District: z.string().min(1, "กรุณาเลือกอำเภอ"),
  Parking_Needs: z.string().min(1, "กรุณาเลือกความต้องการที่จอดรถ"),
  Nearby_Facilities: z.string().min(1, "กรุณาเลือกสิ่งอำนวยความสะดวกใกล้เคียง"),
  Lifestyle_Preferences: z.string().min(1, "กรุณาเลือกรูปแบบการใช้ชีวิต"),
  Special_Requirements: z.string().optional(),
});
