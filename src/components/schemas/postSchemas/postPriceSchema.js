import { z } from "zod";

export const postPriceSchema = z.object({
  Price: z.coerce.number().min(0, "กรุณากรอกราคาให้ถูกต้อง"),
  Deposit_Amount: z.coerce
    .number({ invalid_type_error: "กรุณากรอกเงินดาวน์" })
    .min(1, "กรุณากรอกเงินดาวน์ให้ถูกต้อง"),
  Interest: z.coerce.number().min(0).max(25).optional().nullable(),
  Other_related_expenses: z.string().trim().max(200).optional(),
});
