import { z } from "zod";

const numOrUndef = (min, max) =>
  z
    .preprocess(
      (v) => (v === "" || v == null ? undefined : Number(v)),
      z.number().min(min).max(max)
    )
    .optional();

export const postLocationSchema = z.object({
  Province: z.string().min(1, "กรุณาเลือกจังหวัด"),
  District: z.string().min(1, "กรุณาเลือกอำเภอ/เขต"),
  Subdistrict: z.string().min(1, "กรุณาเลือกตำบล/แขวง"),
  Address: z.string().trim().min(1, "กรุณากรอกที่อยู่"),
  LinkMap: z.string().url("ลิงก์ไม่ถูกต้อง").optional().or(z.literal("")),
  Latitude: numOrUndef(-90, 90),
  Longitude: numOrUndef(-180, 180),
});
