// src/pages/Post_for_sale/PostUpload.jsx
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import PostLayout from "@/layouts/PostLayout";
import { useNavigate } from "react-router-dom";
import { Trash2, Image as ImageIcon, Video as VideoIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { apiClient } from "@/api/authconfig";

/* ================== Config ================== */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEOS = 2;

const ACCEPT_IMAGES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];

/* ================== Helpers ================== */
const prettySizeMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + " MB";

// id สำหรับ key
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve) => {
    if (!videoFile.type.startsWith("video/")) return resolve("");
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      try {
        video.currentTime = Math.min(1, (video.duration || 2) * 0.2);
      } catch {}
    };
    video.onseeked = () => {
      const w = video.videoWidth || 320;
      const h = video.videoHeight || 180;
      canvas.width = w;
      canvas.height = h;
      context.drawImage(video, 0, 0, w, h);
      URL.revokeObjectURL(video.src);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve("");
    };
  });
};

export default function PostUpload() {
  const navigate = useNavigate();
  const form = useFormContext();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDraggingImg, setIsDraggingImg] = useState(false);
  const [isDraggingVid, setIsDraggingVid] = useState(false);

  const images = form.watch("images") || [];
  const videos = form.watch("videos") || [];

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  // เก็บ objectURL เพื่อ revoke ตอน unmount/ลบ
  const urlBinRef = useRef(new Set());

  const openFilePicker = () => fileInputRef.current?.click();
  const openVideoPicker = () => videoInputRef.current?.click();

  const isAllowedImage = (file) => ACCEPT_IMAGES.includes(file?.type);
  const isAllowedVideo = (file) => ACCEPT_VIDEOS.includes(file?.type);

  /* ---------- Image Handlers ---------- */
  const handleAddImages = useCallback(
    (files) => {
      const arr = Array.from(files || []);
      if (!arr.length) return false;

      const next = [];
      for (const file of arr) {
        if (!isAllowedImage(file)) {
          setError(
            `ไฟล์ "${file.name}" ไม่ใช่ชนิดรูปที่รองรับ (jpeg/png/webp)`
          );
          return false;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setError(`"${file.name}" ขนาดเกิน ${prettySizeMB(MAX_IMAGE_SIZE)}`);
          return false;
        }
        const id = uid();
        const preview = URL.createObjectURL(file);
        urlBinRef.current.add(preview);
        next.push({
          id,
          file,
          name: file.name,
          size: file.size,
          preview,
        });
      }

      const updated = [...images, ...next];
      if (updated.length > MAX_IMAGES) {
        setError(`เพิ่มรูปได้สูงสุด ${MAX_IMAGES} รูป`);
        next.forEach((n) => {
          if (n.preview) {
            URL.revokeObjectURL(n.preview);
            urlBinRef.current.delete(n.preview);
          }
        });
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
    const it = images[index];
    if (it?.preview) {
      URL.revokeObjectURL(it.preview);
      urlBinRef.current.delete(it.preview);
    }
    const updatedImages = images.filter((_, i) => i !== index);
    form.setValue("images", updatedImages, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleDropImages = (e) => {
    e.preventDefault();
    setIsDraggingImg(false);
    if (e.dataTransfer.files?.length) handleAddImages(e.dataTransfer.files);
  };
  const handleDragOverImages = (e) => {
    e.preventDefault();
    setIsDraggingImg(true);
  };
  const handleDragLeaveImages = () => setIsDraggingImg(false);

  /* ---------- Video Handlers ---------- */
  const handleAddVideos = useCallback(
    async (files) => {
      const arr = Array.from(files || []);
      if (!arr.length) return false;

      const next = [];
      for (const file of arr) {
        if (!isAllowedVideo(file)) {
          setError(
            `ไฟล์ "${file.name}" ไม่ใช่ชนิดวิดีโอที่รองรับ (mp4/mov/webm)`
          );
          return false;
        }
        if (file.size > MAX_VIDEO_SIZE) {
          setError(`"${file.name}" ขนาดเกิน ${prettySizeMB(MAX_VIDEO_SIZE)}`);
          return false;
        }
      }

      for (const file of arr) {
        const id = uid();
        const preview = URL.createObjectURL(file);
        urlBinRef.current.add(preview);
        const thumbnail = await generateVideoThumbnail(file);
        next.push({
          id,
          file,
          name: file.name,
          size: file.size,
          preview,
          thumbnail,
        });
      }

      const updated = [...videos, ...next];
      if (updated.length > MAX_VIDEOS) {
        setError(`เพิ่มวิดีโอได้สูงสุด ${MAX_VIDEOS} ไฟล์`);
        next.forEach((n) => {
          if (n.preview) {
            URL.revokeObjectURL(n.preview);
            urlBinRef.current.delete(n.preview);
          }
        });
        return false;
      }

      setError("");
      form.setValue("videos", updated, {
        shouldValidate: true,
        shouldDirty: true,
      });
      return true;
    },
    [form, videos]
  );

  const handleRemoveVideo = (index) => {
    const it = videos[index];
    if (it?.preview) {
      URL.revokeObjectURL(it.preview);
      urlBinRef.current.delete(it.preview);
    }
    const updatedVideos = videos.filter((_, i) => i !== index);
    form.setValue("videos", updatedVideos, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const handleDropVideos = (e) => {
    e.preventDefault();
    setIsDraggingVid(false);
    if (e.dataTransfer.files?.length) handleAddVideos(e.dataTransfer.files);
  };
  const handleDragOverVideos = (e) => {
    e.preventDefault();
    setIsDraggingVid(true);
  };
  const handleDragLeaveVideos = () => setIsDraggingVid(false);

  /* ---------- Cleanup on Unmount ---------- */
  useEffect(() => {
    return () => {
      // revoke ทุก objectURL ที่เคยสร้าง
      urlBinRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      urlBinRef.current.clear();
    };
  }, []);

  const canAddMoreImages = images.length < MAX_IMAGES;
  const canAddMoreVideos = videos.length < MAX_VIDEOS;

  /* ---------- Submit ---------- */
  const handleNext = async () => {
    const isConfirmed = window.confirm(
      "กรุณาตรวจสอบรายละเอียดให้ครบถ้วน\nคุณแน่ใจหรือไม่ว่าต้องการสร้างโพสต์นี้?"
    );
    if (!isConfirmed) return;

    if (images.length === 0) {
      setError("กรุณาอัปโหลดรูปภาพอย่างน้อย 1 รูป");
      return;
    }

    setError("");
    setIsSubmitting(true);

    const allData = form.getValues();
    const formData = new FormData();

    // รวมทุกฟิลด์ไว้ในลูปเดียวกัน (กัน append ซ้ำ)
    for (const key in allData) {
      if (!Object.prototype.hasOwnProperty.call(allData, key)) continue;
      const value = allData[key];
      if (value === null || value === undefined) continue;

      // 1) propertyUnits -> JSON string
      if (key === "propertyUnits") {
        formData.append(key, JSON.stringify(value));
      }
      // 2) รูป/วิดีโอ -> append ไฟล์จริง
      else if (key === "images" || key === "videos") {
        (value || []).forEach((fileWrapper) => {
          if (fileWrapper?.file instanceof File) {
            formData.append(key, fileWrapper.file);
          }
        });
      }
      // 3) Array อื่นๆ -> append ทีละค่า
      else if (Array.isArray(value)) {
        value.forEach((item) => formData.append(key, String(item)));
      }
      // 4) ค่าทั่วไป -> append เป็น string
      else {
        formData.append(key, String(value));
      }
    }

    // 🔎 DEBUG: แสดงรายการที่แนบใน FormData (ควรเห็น FD> images (File) ...)
    for (const [k, v] of formData.entries()) {
      // eslint-disable-next-line no-console
      console.log(
        "FD>",
        k,
        v instanceof File ? `(File) ${v.name} ${v.type} ${v.size}` : v
      );
    }

    try {
      const response = await apiClient.post("/propertypost", formData, {
        withCredentials: true, // ถ้า backend ใช้ session/cookie
        // ❗ห้ามกำหนด Content-Type เอง ให้เบราว์เซอร์ตั้ง boundary อัตโนมัติ
        headers: { "Content-Type": undefined },
        // กัน Axios ไปแปลง FormData เป็นอย่างอื่น
        transformRequest: [(data) => data],
      });

      // navigate ก่อน แล้วค่อย reset เพื่อให้ location.state ส่งถึง PostConfirm ครบ
      navigate("/seller/post-for-sale/confirm", {
        state: { postId: response.data.id },
      });
      form.reset();
    } catch (apiError) {
      const message =
        apiError?.response?.data?.message ||
        apiError?.message ||
        "เกิดข้อผิดพลาดในการสร้างโพสต์";
      setError(message);
      // eslint-disable-next-line no-console
      console.error("การส่งข้อมูลผิดพลาด:", apiError);
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
              <h2 className="text-2xl font-semibold mt-1">อัปโหลดสื่อ</h2>
              <p className="text-muted-foreground text-sm">
                อัปโหลดรูปภาพและวิดีโอสำหรับประกาศของคุณ
              </p>
            </div>

            {/* IMAGES */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">
                  รูปภาพ (สูงสุด {MAX_IMAGES} รูป, ไฟล์ละไม่เกิน{" "}
                  {prettySizeMB(MAX_IMAGE_SIZE)})
                </h3>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => (canAddMoreImages ? openFilePicker() : null)}
                onKeyDown={(e) =>
                  e.key === "Enter" || e.key === " " ? openFilePicker() : null
                }
                onDrop={handleDropImages}
                onDragOver={handleDragOverImages}
                onDragLeave={handleDragLeaveImages}
                className={`rounded-xl border-2 border-dashed transition-colors p-6 md:p-8 text-center ${
                  canAddMoreImages
                    ? "cursor-pointer hover:bg-primary/10"
                    : "opacity-60 cursor-not-allowed"
                } ${
                  isDraggingImg
                    ? "border-primary bg-primary/10"
                    : "border-primary/40"
                }`}
              >
                <p className="font-medium">
                  {canAddMoreImages
                    ? "ลากและวางรูปภาพที่นี่ หรือคลิกเพื่อเลือกไฟล์"
                    : "ครบจำนวนรูปแล้ว"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  อัปโหลดแล้ว {images.length} / {MAX_IMAGES} รูป
                </p>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept={ACCEPT_IMAGES.join(",")}
                  multiple
                  onChange={(e) => {
                    if (handleAddImages(e.target.files)) e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>

              {!!images.length && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {images.map((img, idx) => (
                    <div
                      key={img.id || idx}
                      className="relative group rounded-lg overflow-hidden ring-1 ring-black/5"
                    >
                      <img
                        src={img.preview}
                        alt={img.name || `preview-${idx}`}
                        className="w-full h-36 object-cover"
                      />
                      <div className="absolute left-2 top-2 text-xs px-2 py-0.5 rounded-full bg-black/60 text-white">
                        {idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`ลบรูปที่ ${idx + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="px-2 py-1">
                        <p className="text-xs truncate">
                          {img.name || "image"}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {prettySizeMB(img.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* VIDEOS */}
            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-primary" />
                <h3 className="font-semibold">
                  วิดีโอ (สูงสุด {MAX_VIDEOS} ไฟล์, ไฟล์ละไม่เกิน{" "}
                  {prettySizeMB(MAX_VIDEO_SIZE)})
                </h3>
              </div>

              <div
                role="button"
                tabIndex={0}
                onClick={() => (canAddMoreVideos ? openVideoPicker() : null)}
                onKeyDown={(e) =>
                  e.key === "Enter" || e.key === " " ? openVideoPicker() : null
                }
                onDrop={handleDropVideos}
                onDragOver={handleDragOverVideos}
                onDragLeave={handleDragLeaveVideos}
                className={`rounded-xl border-2 border-dashed transition-colors p-6 md:p-8 text-center ${
                  canAddMoreVideos
                    ? "cursor-pointer hover:bg-primary/10"
                    : "opacity-60 cursor-not-allowed"
                } ${
                  isDraggingVid
                    ? "border-primary bg-primary/10"
                    : "border-primary/40"
                }`}
              >
                <p className="font-medium">
                  {canAddMoreVideos
                    ? "ลากและวางวิดีโอที่นี่ หรือคลิกเพื่อเลือกไฟล์"
                    : "ครบจำนวนวิดีโอแล้ว"}
                </p>
                <p className="text-xs text-muted-foreground mt-1">
                  อัปโหลดแล้ว {videos.length} / {MAX_VIDEOS} วิดีโอ
                </p>
                <input
                  ref={videoInputRef}
                  type="file"
                  accept={ACCEPT_VIDEOS.join(",")}
                  multiple
                  onChange={async (e) => {
                    const ok = await handleAddVideos(e.target.files);
                    if (ok) e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>

              {!!videos.length && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map((vid, idx) => (
                    <div
                      key={vid.id || idx}
                      className="relative group rounded-lg overflow-hidden ring-1 ring-black/5"
                    >
                      <video
                        src={vid.preview}
                        poster={vid.thumbnail}
                        className="w-full h-36 object-cover bg-black"
                      />
                      <div className="absolute left-2 top-2 text-xs px-2 py-0.5 rounded-full bg-black/60 text-white">
                        {idx + 1}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleRemoveVideo(idx)}
                        className="absolute top-2 right-2 bg-red-500 text-white rounded-full p-1.5 shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                        aria-label={`ลบวิดีโอที่ ${idx + 1}`}
                      >
                        <Trash2 size={16} />
                      </button>
                      <div className="px-2 py-1">
                        <p className="text-xs truncate">{vid.name}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {prettySizeMB(vid.size)}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

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
    </PostLayout>
  );
}
