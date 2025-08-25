import { z } from "zod";

export const postPriceSchema = z.object({
  Price: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(0, "ราคาต้อง ≥ 0")
  ),
  Sell_Rent: z.string().min(1, "กรุณาเลือกประเภทการขาย/เช่า"),
  Deposit_Amount: z.preprocess(
    (v) => (v === "" || v === undefined || v === null ? undefined : Number(v)),
    z.number().min(0, "เงินมัดจำต้อง ≥ 0").optional()
  ),
  Other_related_expenses: z.string().optional(),
});
