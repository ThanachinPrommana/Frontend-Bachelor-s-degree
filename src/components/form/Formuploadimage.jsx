// src/components/form/Formuploadimage.jsx
import { useForm } from "react-hook-form";
import { useMemo, useRef, useState } from "react";
import { updateImage } from "@/api/user";
import { Loader2 } from "lucide-react";

/** ย่อภาพฝั่ง client: resize ให้ด้านยาวสุดไม่เกิน 512px + แปลงเป็น WebP คุณภาพ ~0.82 */
async function downscaleImage(
  file,
  { maxSide = 512, quality = 0.82, mime = "image/webp" } = {}
) {
  // ลองใช้ createImageBitmap (เร็ว) ถ้าใช้ไม่ได้ fallback เป็น <img>
  async function loadSource() {
    try {
      return await createImageBitmap(file);
    } catch {
      return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => resolve(img);
        img.onerror = reject;
        img.src = URL.createObjectURL(file);
      });
    }
  }

  const src = await loadSource();
  const w = src.width;
  const h = src.height;
  const scale = Math.min(1, maxSide / Math.max(w, h));
  const targetW = Math.round(w * scale);
  const targetH = Math.round(h * scale);

  // ใช้ OffscreenCanvas ถ้ามี (ลื่นกว่า) ไม่งั้นใช้ <canvas>
  const canvas =
    typeof OffscreenCanvas !== "undefined"
      ? new OffscreenCanvas(targetW, targetH)
      : Object.assign(document.createElement("canvas"), {
          width: targetW,
          height: targetH,
        });

  if (!("width" in canvas)) {
    canvas.width = targetW;
    canvas.height = targetH;
  }

  const ctx = canvas.getContext("2d", { alpha: false, desynchronized: true });
  ctx.drawImage(src, 0, 0, targetW, targetH);

  const blob = canvas.convertToBlob
    ? await canvas.convertToBlob({ type: mime, quality })
    : await new Promise((res) => canvas.toBlob(res, mime, quality));

  try {
    src.close && src.close();
  } catch {}

  const newName = file.name.replace(/\.(jpe?g|png|gif|bmp|tiff?)$/i, ".webp");
  return new File([blob], newName, { type: mime, lastModified: Date.now() });
}

const Formuploadimage = ({ onUploadSuccess }) => {
  const { register, handleSubmit, watch, reset } = useForm();
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const file = watch("image")?.[0];

  // พรีวิวทันที (optimistic) — ไม่รออัปโหลดเสร็จ
  const previewUrl = useMemo(
    () => (file ? URL.createObjectURL(file) : ""),
    [file]
  );
  const revokeRef = useRef(null);
  if (revokeRef.current) {
    revokeRef.current();
    revokeRef.current = null;
  }
  if (previewUrl) {
    revokeRef.current = () => URL.revokeObjectURL(previewUrl);
  }

  const onSubmit = async (data) => {
    const original = data.image?.[0];
    if (!original) {
      console.log("ไม่มีรูปภาพใหม่ ไม่ต้องอัปโหลด");
      return;
    }

    try {
      setUploading(true);
      setProgress(1);

      // 1) ย่อก่อนอัป: ถ้าเกิน ~250KB ค่อยย่อ ไม่งั้นส่งต้นฉบับได้
      const shouldDownscale = original.size > 250 * 1024;
      const toUpload = shouldDownscale
        ? await downscaleImage(original, { maxSide: 512, quality: 0.82 })
        : original;

      // 2) อัปโหลด พร้อม progress (Axios จะยิง onUploadProgress)
      const formData = new FormData();
      formData.append("image", toUpload);

      const result = await updateImage(formData, (e) => {
        if (!e.total) return;
        const pct = Math.min(99, Math.round((e.loaded / e.total) * 100));
        setProgress(pct);
      });

      // 3) แจ้งผู้เรียกใช้งาน (ให้ส่งรูปพรีวิว + URL ที่แบ็กเอนด์อัปเดตใน session กลับมา)
      // API ฝั่งคุณตอบ { message, user: {...} } -> รูปอยู่ที่ result.user?.image
      onUploadSuccess?.({
        preview: previewUrl, // แสดงทันที
        url: result?.user?.image || "", // URL จริงในระบบ (ถ้ามี)
      });

      // reset ฟอร์ม
      reset({ image: null });
      setProgress(100);
    } catch (err) {
      console.error("Upload failed:", err);
      alert("อัปโหลดล้มเหลว");
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 400);
    }
  };

  return (
    <form className="space-y-4" onSubmit={handleSubmit(onSubmit)}>
      <div className="flex flex-col justify-center space-y-3">
        <label className="font-semibold block mb-1">Upload Image</label>

        <input
          type="file"
          accept="image/*"
          {...register("image")}
          disabled={uploading}
          className="cursor-pointer"
        />

        {/* พรีวิวทันที */}
        {previewUrl && (
          <img
            src={previewUrl}
            alt="preview"
            className="w-16 h-16 rounded-full object-cover border"
          />
        )}

        <button
          type="submit"
          disabled={uploading || !file}
          className="px-4 py-2 bg-[#2C3E50] text-white rounded hover:bg-[#1a252f] max-w-30 flex justify-center items-center gap-2"
        >
          {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : null}
          {uploading ? `Uploading${progress ? ` ${progress}%` : ""}` : "Submit"}
        </button>

        {uploading && (
          <div className="w-full h-2 bg-gray-200 rounded overflow-hidden">
            <div
              className="h-full bg-[#2C3E50] transition-all"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        {!uploading && file && (
          <p className="text-xs text-gray-500">
            ขนาดเดิม: {(file.size / 1024).toFixed(0)} KB — จะย่อเหลือด้านยาวสุด
            ≤ 512px และบีบอัดเป็น WebP เพื่ออัปโหลดเร็วขึ้น
          </p>
        )}
      </div>
    </form>
  );
};

export default Formuploadimage;
