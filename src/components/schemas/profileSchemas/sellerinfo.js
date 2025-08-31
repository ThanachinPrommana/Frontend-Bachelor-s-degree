import { z } from "zod";

export const sellerSchema = z
  .object({
    First_name: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val === "" || val.length >= 2, {
        message: "ชื่อต้องมีอย่างน้อย 2 ตัวอักษร",
      })
      .refine((val) => val === "" || /^[A-Za-zก-๙\s]+$/.test(val), {
        message: "ชื่อควรประกอบด้วยตัวอักษรเท่านั้น",
      })
      .optional(),

    Last_name: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val === "" || val.length >= 2, {
        message: "นามสกุลต้องมีอย่างน้อย 2 ตัวอักษร",
      })
      .refine((val) => val === "" || /^[A-Za-zก-๙\s]+$/.test(val), {
        message: "นามสกุลควรประกอบด้วยตัวอักษรเท่านั้น",
      })
      .optional(),

    Email: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val === "" || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val), {
        message: "รูปแบบอีเมลไม่ถูกต้อง",
      })
      .refine((val) => val === "" || val.length >= 6, {
        message: "อีเมลควรมีอย่างน้อย 6 ตัวอักษร",
      })
      .optional(),

    Phone: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val === "" || /^[0-9]+$/.test(val), {
        message: "เบอร์โทรต้องเป็นตัวเลขเท่านั้น",
      })
      .refine((val) => val === "" || val.length >= 9, {
        message: "เบอร์โทรต้องมีอย่างน้อย 9 หลัก",
      })
      .refine((val) => val === "" || /^0[0-9]{8,9}$/.test(val), {
        message: "เบอร์โทรต้องขึ้นต้นด้วย 0 และมี 9-10 หลัก",
      })
      .optional(),

    National_ID: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val === "" || /^[0-9]{13}$/.test(val), {
        message: "เลขบัตรประชาชนต้องเป็นตัวเลข 13 หลัก",
      })
      .optional(),

    Company_Name: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val === "" || val.length >= 2, {
        message: "ชื่อบริษัทต้องมีอย่างน้อย 2 ตัวอักษร",
      })
      .optional(),

    RealEstate_License: z
      .string()
      .transform((val) => val.trim())
      .refine((val) => val === "" || val.length >= 5, {
        message: "ใบอนุญาตต้องมีอย่างน้อย 5 ตัวอักษร",
      })
      .optional(),
  })
  .refine(
    (data) =>
      Object.values(data).some(
        (val) => val !== undefined && val !== "",
      ),
    {
      message: "กรุณากรอกข้อมูลอย่างน้อย 1 ช่อง",
      path: [], // error ที่ระดับฟอร์ม
    },
  );
