import { z } from "zod";
const currentYear = new Date().getFullYear();

const numOpt = z
  .preprocess(
    (v) => (v === "" || v == null ? undefined : Number(v)),
    z.number().min(0)
  )
  .optional();

const intReq = z.coerce.number().int().min(0);
const intOpt = z.coerce.number().int().min(0).optional();

const NEARBY = ["BTS_MRT", "School", "Hospital", "Mall_Market", "Park"];
const AMENITIES = [
  "Swimming_Pool",
  "Fitness_Center",
  "Co_working_Space",
  "Pet_Friendly",
];

export const postDetailSchema = z
  .object({
    categoryId: z.string().min(1, "กรุณาเลือกประเภททรัพย์สิน"),
    Usable_Area: numOpt,
    Land_Size: numOpt,
    Total_Rooms: intOpt,

    // ✅ ปีที่สร้าง: optional, แต่ถ้ามีค่าต้องเป็นตัวเลข 4 หลักในช่วง 1800–ปัจจุบัน+1
    Year_Built: z
      .preprocess(
        (v) => (v === "" || v == null ? undefined : String(v).trim()),
        z
          .string()
          .regex(/^\d{4}$/, "กรุณากรอกปี 4 หลัก")
          .refine((y) => {
            const n = Number(y);
            return n >= 1800 && n <= currentYear + 1;
          }, "ปีที่สร้างไม่สมเหตุสมผล")
          .optional()
      )
      .optional(),

    Bedrooms: intReq,
    Bathroom: intReq,
    floor: intOpt, // คอนโด UI จะซ่อน/ล้างเองอยู่แล้ว
    Parking_Space: intOpt,
    Nearby_Landmarks: z.array(z.enum(NEARBY)).optional(),
    Additional_Amenities: z.array(z.enum(AMENITIES)).optional(),
  })
  .superRefine((data, ctx) => {
    if (
      data.Total_Rooms != null &&
      data.Bedrooms != null &&
      data.Bathroom != null &&
      data.Total_Rooms < data.Bedrooms + data.Bathroom
    ) {
      ctx.addIssue({
        path: ["Total_Rooms"],
        code: z.ZodIssueCode.custom,
        message: "จำนวนห้องทั้งหมดต้องไม่น้อยกว่าห้องนอน + ห้องน้ำ",
      });
    }
  });
