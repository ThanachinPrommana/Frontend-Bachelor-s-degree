// src/components/schemas/registerSellerSchema.js
import { z } from "zod";

export const registerSellerSchema = z.object({
  Company_Name: z
    .string()
    .trim()
    .max(255, "ยาวเกินไป (สูงสุด 255 ตัวอักษร)")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  RealEstate_License: z
    .string()
    .trim()
    .max(255, "ยาวเกินไป (สูงสุด 255 ตัวอักษร)")
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  nationalIdImage: z
    .union([
      typeof File !== "undefined"
        ? z.instanceof(File).optional()
        : z.any().optional(),
      z.string().url().optional(),
      z.string().length(0).optional(),
    ])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  StartTime: z
    .string()
    .datetime()
    .optional()
    .or(z.string().length(0).optional())
    .transform((v) => (v === "" ? undefined : v)),
});
