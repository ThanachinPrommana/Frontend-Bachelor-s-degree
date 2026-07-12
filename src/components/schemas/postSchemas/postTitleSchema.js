import { z } from "zod";

export const postTitleSchema = z.object({
  Property_Name: z
    .string()
    .trim()
    .min(5, "หัวข้ออย่างน้อย 5 ตัวอักษร")
    .max(120),
  Description: z
    .string()
    .trim()
    .min(10, "รายละเอียดอย่างน้อย 10 ตัวอักษร")
    .max(2000),
});
