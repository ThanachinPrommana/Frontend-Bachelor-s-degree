import { z } from "zod";

const numberOrUndefined = z.preprocess(
  (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
  z.number().min(0, "ต้องไม่น้อยกว่า 0").optional()
);

export const postDetailSchema = z.object({
  Propertytype: z.string().min(1, "กรุณาเลือกประเภท"),
  Usable_Area: numberOrUndefined,
  Land_Size: numberOrUndefined,
  Total_Rooms: numberOrUndefined,
  Year_Built: z.string().optional(),
  Bedrooms: z.preprocess((v) => Number(v), z.number().min(0, "ห้องนอนต้อง ≥ 0")),
  Bathroom: z.preprocess((v) => Number(v), z.number().min(0, "ห้องน้ำต้อง ≥ 0")),
  Nearby_Landmarks: z.array(z.string()).optional(),
  Additional_Amenities: z.array(z.string()).optional(),
  Parking_Space: z.string().optional(),
});
