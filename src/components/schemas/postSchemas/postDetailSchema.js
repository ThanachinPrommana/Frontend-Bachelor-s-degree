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

export const postDetailSchema = z.object({
  categoryId: z.string().min(1, "กรุณาเลือกประเภททรัพย์สิน"), // แม้ Prisma จะ optional แต่นโยบายฟอร์มให้เลือก
  Usable_Area: numOpt,
  Land_Size: numOpt,
  Total_Rooms: intOpt,
  Year_Built: z
    .string()
    .trim()
    .regex(/^\d{4}$/, "กรุณากรอกปี 4 หลัก")
    .refine((y) => {
      const n = Number(y);
      return n >= 1800 && n <= currentYear + 1;
    }, "ปีที่สร้างไม่สมเหตุสมผล")
    .optional(),
  Bedrooms: intReq,
  Bathroom: intReq,
  floor: intOpt,
  Parking_Space: intOpt,
  Nearby_Landmarks: z.array(z.enum(NEARBY)).optional(),
  Additional_Amenities: z.array(z.enum(AMENITIES)).optional(),
});
