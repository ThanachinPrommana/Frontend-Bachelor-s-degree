import { z } from "zod";

export const registerSellerSchema = z.object({
  National_ID: z
    .string()
    .regex(/^[0-9]{13}$/, "เลขบัตรประชาชนต้องมี 13 หลัก"),
  Company_Name: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 2, {
      message: "ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร",
    }),
  RealEstate_License: z
    .string()
    .optional()
    .refine((val) => !val || val.length >= 5, {
      message: "เลขใบอนุญาตต้องมีอย่างน้อย 5 ตัวอักษร",
    }),
});
