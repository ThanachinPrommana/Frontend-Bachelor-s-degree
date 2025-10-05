import { z } from "zod";

export const postUploadSchema = z.object({
  images: z.array(z.any()).min(1, "กรุณาอัปโหลดรูปอย่างน้อย 1 รูป"),
  videos: z.array(z.any()).max(2, "อัปโหลดวิดีโอได้สูงสุด 2 ไฟล์").optional(),
});
