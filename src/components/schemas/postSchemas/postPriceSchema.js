// src/components/schemas/postSchemas/postPriceSchema.js
import { z } from "zod";

export const postPriceSchema = z
  .object({
    Price: z.coerce
      .number({ invalid_type_error: "กรุณากรอกราคา" })
      .min(0, "กรุณากรอกราคาให้ถูกต้อง"),

    Deposit_Percent: z.coerce
      .number({ invalid_type_error: "กรุณากรอกเปอร์เซ็นต์เงินดาวน์" })
      .min(0, "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0–100")
      .max(100, "เปอร์เซ็นต์ต้องอยู่ระหว่าง 0–100"),

    Deposit_Amount: z.coerce
      .number({ invalid_type_error: "กรุณากรอกจำนวนเงินดาวน์" })
      .min(0, "กรุณากรอกเงินดาวน์ให้ถูกต้อง"),

    // ⬇ เปลี่ยนเป็น array ให้ตรงกับหน้า
    Other_related_expenses: z.array(z.string()).optional().default([]),

    // ถ้าหลังบ้านยังใช้ค่านี้ คงไว้ optional ได้
    Interest: z.coerce.number().min(0).max(25).optional().nullable(),
  })
  .superRefine((data, ctx) => {
    if (data.Price != null && data.Deposit_Amount != null) {
      if (data.Deposit_Amount > data.Price) {
        ctx.addIssue({
          path: ["Deposit_Amount"],
          code: z.ZodIssueCode.custom,
          message: "เงินดาวน์ต้องไม่เกินราคาขาย",
        });
      }
    }
  });
