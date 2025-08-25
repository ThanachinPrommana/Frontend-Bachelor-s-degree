import { z } from "zod";

export const postLocationSchema = z.object({
  Province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  District: z.string().min(1, "กรุณาเลือกอำเภอ"),
  Subdistrict: z.string().min(1, "กรุณาเลือกตำบล"),
  LinkMap: z.string().url("กรุณากรอกลิงก์แผนที่ให้ถูกต้อง").optional().or(z.literal("")),
  Latitude: z.number({ invalid_type_error: "กรุณากรอกละติจูดเป็นตัวเลข" }).optional(),
  Longitude: z.number({ invalid_type_error: "กรุณากรอกลองจิจูดเป็นตัวเลข" }).optional(),
});
