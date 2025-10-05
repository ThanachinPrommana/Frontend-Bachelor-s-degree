import { z } from "zod";

export const postPriceSchema = z.object({
  Sell_Rent: z.literal("SALE").default("SALE"),
  Price: z.coerce.number().min(0, "กรุณากรอกราคาให้ถูกต้อง"), // ✅ ยอม 0 ได้
  Deposit_Amount: z.coerce.number().min(0).optional().nullable(),
  Interest: z.coerce.number().min(0).max(25).optional().nullable(),
  Other_related_expenses: z.string().trim().max(200).optional(),
});
