import { z } from "zod";

export const postInformSchema = z.object({
  Name: z.string().trim().optional(), // Prisma: optional
  Phone: z
    .string()
    .regex(/^0\d{9}$/, "กรุณากรอกเบอร์โทรศัพท์ไทย 10 หลัก (ขึ้นต้นด้วย 0)"),
  Link_line: z.string().url("ลิงก์ไม่ถูกต้อง").optional().or(z.literal("")),
  Link_facbook: z.string().url("ลิงก์ไม่ถูกต้อง").optional().or(z.literal("")),
  Contract_Seller: z.string().trim().optional(),
});
