import { z } from "zod";

export const postTitleSchema = z.object({
  Property_Name: z.string().min(5, "หัวข้อประกาศอย่างน้อย 5 ตัวอักษร"),
  Description: z.string().min(10, "รายละเอียดอย่างน้อย 10 ตัวอักษร"),
});
