// src/components/schemas/registerSellerSchema.js
import { z } from "zod";

// helper: ตัดช่องว่าง/ขีดออกจากเลขบัตร
const digitsOnly = (s) => (s || "").replace(/\D/g, "");

export const registerSellerSchema = z.object({
  // บังคับ เนื่องจากการสร้าง Seller ครั้งแรกต้องมี National_ID
  National_ID: z
    .string({ required_error: "กรุณากรอกเลขบัตรประชาชน" })
    .transform(digitsOnly)
    .refine((v) => /^\d{13}$/.test(v), "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก"),

  // ไม่บังคับ กรอกก็ได้ไม่กรอกก็ได้; แปลง "" -> undefined เพื่อลด noise ตอนส่งขึ้น
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

  // ถ้าฟรอนต์มีอัปโหลดรูปบัตร (multipart/form-data) ให้ส่งเป็น File หรือ URL ก็ได้
  // - ตอนส่งครั้งแรกมักจะเป็น File (จาก <input type="file" />)
  // - ถ้าแก้ไขโปรไฟล์ภายหลัง อาจส่งเป็น string (URL เดิม)
  nationalIdImage: z
    .union([
      z.instanceof(File).optional(),
      z.string().url().optional(),
      z.string().length(0).optional(), // เผื่อส่งค่าว่าง
    ])
    .optional()
    .transform((v) => (v === "" ? undefined : v)),

  // ถ้าฟอร์มมี field นี้ก็ปล่อยผ่านเป็น optional ได้ (แบ็กเอนด์รองรับ)
  StartTime: z
    .string()
    .datetime()
    .optional()
    .or(z.string().length(0).optional())
    .transform((v) => (v === "" ? undefined : v)),
});

// (ถ้าคุณมีไฟล์ index.js รวม schema ทั้งหมดอยู่แล้ว)
// อย่าลืม export ในไฟล์รวมด้วย:
// export { registerSellerSchema } from "./registerSellerSchema";
