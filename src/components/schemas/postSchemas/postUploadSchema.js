import { z } from "zod";

const hasAtLeastOneFile = (val) => {
  if (!val) return false;
  // FileList
  if (typeof FileList !== "undefined" && val instanceof FileList) {
    return val.length > 0;
  }
  // Array<File>
  if (Array.isArray(val)) {
    return val.length > 0;
  }
  return false;
};

export const postUploadSchema = z.object({
  images: z
    .any()
    .refine(hasAtLeastOneFile, "กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป"),
});
