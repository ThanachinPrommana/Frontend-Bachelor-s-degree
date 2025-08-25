import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import PostLayout from "@/layouts/PostLayout";
import { useNavigate } from "react-router-dom";
import { Trash2, Image as ImageIcon, CircleX, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import axios from "axios";

const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const API_URL = "http://localhost:8200";

function PostUpload() {
  const navigate = useNavigate();
  const form = useFormContext();

  const [error, setError] = useState("");
  const [showImageModal, setShowImageModal] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const images = form.watch("images") || [];
  const fileInputRef = useRef(null);

  const openFilePicker = () => fileInputRef.current?.click();

  const isImageFile = (file) =>
    file && file.type && file.type.startsWith("image/");

  const handleAddImages = useCallback(
    (files) => {
      const arr = Array.from(files || []);
      if (!arr.length) return false;

      // ตรวจชนิดไฟล์ + ขนาด
      for (const file of arr) {
        if (!isImageFile(file)) {
          setError(`ไฟล์ "${file.name}" ไม่ใช่รูปภาพที่รองรับ`);
          return false;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setError(`ไฟล์รูปภาพ "${file.name}" ขนาดเกิน 5MB`);
          return false;
        }
      }

      // รวมกับของเดิม
      const newFiles = arr.map((file) => ({
        file,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
      }));

      const updated = [...images, ...newFiles];
      if (updated.length > MAX_IMAGES) {
        setError(`เพิ่มรูปได้สูงสุด ${MAX_IMAGES} รูป`);
        // คืน URL ที่เพิ่งสร้าง เพราะไม่ได้ใช้ต่อ
        newFiles.forEach((n) => URL.revokeObjectURL(n.preview));
        return false;
      }

      setError("");
      form.setValue("images", updated, {
        shouldValidate: true,
        shouldDirty: true,
      });
      return true;
    },
    [form, images]
  );

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    const updatedImages = images.filter((_, i) => i !== index);
    form.setValue("images", updatedImages, {
      shouldDirty: true,
      shouldValidate: false,
    });
  };

  const handleDropImages = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files?.length) handleAddImages(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false);

  // เคลียร์ URL เมื่อ unmount หรือ images เปลี่ยน
  useEffect(() => {
    return () => {
      (images || []).forEach(
        (img) => img?.preview && URL.revokeObjectURL(img.preview)
      );
    };
  }, []); // ครั้งเดียวตอน unmount

  const prettySizeMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + " MB";

  const canAddMore = images.length < MAX_IMAGES;

  // ส่งข้อมูล
  const handleNext = async () => {
    if (images.length === 0) {
      setError("กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป");
      return;
    }
    setError("");
    setIsSubmitting(true);

    const allData = form.getValues();
    const formData = new FormData();

    // แนบไฟล์รูป
    allData.images.forEach((img) => formData.append("images", img.file));

    // แนบข้อมูลอื่น
    for (const key in allData) {
      if (key === "images") continue;
      const value = allData[key];
      if (value === null || value === undefined) {
        formData.append(key, "");
      } else if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, item));
      } else {
        formData.append(key, value);
      }
    }

    try {
      const userId = localStorage.getItem("id");
      if (!userId)
        throw new Error("ไม่พบ User ID กรุณาเข้าสู่ระบบใหม่อีกครั้ง");

      const response = await axios.post(
        `${API_URL}/api/propertypost/${userId}`,
        formData,
        {
          headers: {},
        }
      );

      // สำเร็จ
      form.reset();
      navigate("/seller/post-for-sale/confirm", {
        state: { postId: response.data.id },
      });
    } catch (apiError) {
      const message =
        apiError.response?.data?.message ||
        apiError.message ||
        "เกิดข้อผิดพลาดในการสร้างโพสต์";
      setError(message);
      console.error("API Error:", apiError);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PostLayout currentStep={5}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardContent className="py-8 px-6 md:px-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <ImageIcon className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mt-1">อัปโหลดรูปภาพ</h2>
              <p className="text-muted-foreground text-sm">
                เลือกรูปภาพอสังหาริมทรัพย์ของคุณ (สูงสุด {MAX_IMAGES} รูป, ไฟล์
                ≤ 5MB)
              </p>
            </div>

            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                รองรับไฟล์รูปมาตรฐาน (
                <span className="font-medium">image/*</span>) ลากมาวางได้
                หรือคลิกเพื่อเลือกหลายไฟล์ในครั้งเดียว
              </p>
            </div>

            {/* Dropzone */}
            <div
              role="button"
              tabIndex={0}
              onClick={() => (canAddMore ? openFilePicker() : null)}
              onKeyDown={(e) =>
                e.key === "Enter" || e.key === " " ? openFilePicker() : null
              }
              onDrop={handleDropImages}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className={[
                "rounded-xl border-2 border-dashed transition-colors cursor-pointer",
                "p-6 md:p-8 text-center",
                canAddMore
                  ? "hover:bg-primary/10"
                  : "opacity-60 cursor-not-allowed",
                isDragging
                  ? "border-primary bg-primary/10"
                  : "border-primary/40",
              ].join(" ")}
            >
              <p className="font-medium">
                {canAddMore
                  ? "ลากและวางรูปภาพที่นี่ หรือคลิกเพื่อเลือกไฟล์"
                  : "ครบจำนวนรูปแล้ว"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                อัปโหลดแล้ว {images.length} / {MAX_IMAGES} รูป
              </p>

              {/* hidden input */}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (handleAddImages(e.target.files)) {
                    // เคลียร์ค่า input ให้เลือกไฟล์เดิมซ้ำได้
                    e.target.value = "";
                  }
                }}
                className="hidden"
              />
            </div>

            {/* Preview grid */}
            {!!images.length && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {images.map((img, idx) => (
                  <div
                    key={idx}
                    className="relative group rounded-lg overflow-hidden ring-1 ring-black/5"
                  >
                    <img
                      src={img.preview}
                      alt={img.name || `preview-${idx}`}
                      className="w-full h-36 object-cover"
                    />

                    {/* badge index */}
                    <div className="absolute left-2 top-2 text-xs px-2 py-0.5 rounded-full bg-black/60 text-white">
                      {idx + 1}
                    </div>

                    {/* remove button */}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label={`ลบรูปที่ ${idx + 1}`}
                    >
                      <Trash2 size={16} />
                    </button>

                    {/* file meta */}
                    <div className="px-2 py-1">
                      <p className="text-xs truncate">{img.name || "image"}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {prettySizeMB(img.size)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Error */}
            {error && (
              <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            )}

            {/* Actions */}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/seller/post-for-sale/inform")}
              >
                ย้อนกลับ
              </Button>

              <Button
                onClick={handleNext}
                disabled={isSubmitting}
                className="min-w-[140px]"
              >
                {isSubmitting ? "กำลังอัปโหลด..." : "ถัดไป"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal เลือกไฟล์แบบดั้งเดิม (คงไว้ตามเดิม แต่แต่งสไตล์เพิ่มเล็กน้อย) */}
      {showImageModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg shadow-lg w-11/12 max-w-lg relative">
            <CircleX
              className="absolute top-4 right-4 cursor-pointer hover:text-black text-gray-500"
              onClick={() => setShowImageModal(false)}
            />
            <h2 className="text-xl font-bold mb-4 text-center">เพิ่มรูปภาพ</h2>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={(e) => {
                if (handleAddImages(e.target.files)) {
                  setShowImageModal(false);
                }
              }}
              className="w-full text-sm text-slate-600
                         file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0
                         file:text-sm file:font-semibold file:bg-primary/10 file:text-primary
                         hover:file:bg-primary/20"
            />
          </div>
        </div>
      )}
    </PostLayout>
  );
}

export default PostUpload;
