import React, { useEffect, useRef, useState, useCallback } from "react";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import PostLayout from "@/layouts/PostLayout";
import { useNavigate } from "react-router-dom";
import {
  Trash2,
  Image as ImageIcon,
  Video as VideoIcon,
  Info,
} from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { createpost } from "@/api/post";

// --- Constants ---
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEOS = 2;

// --- Helper Functions ---
/**
 * Converts bytes to a human-readable MB string.
 * @param {number} bytes - The number of bytes.
 * @returns {string} The size in MB.
 */
const prettySizeMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + " MB";

/**
 * Generates a video thumbnail from a video file.
 * @param {File} videoFile - The video file to process.
 * @returns {Promise<string>} A promise that resolves with the thumbnail as a data URL.
 */
const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve) => {
    if (!videoFile.type.startsWith("video/")) {
      resolve(""); // Return empty string if not a video file
      return;
    }
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const context = canvas.getContext("2d");

    video.src = URL.createObjectURL(videoFile);
    video.muted = true;
    video.playsInline = true;

    video.onloadeddata = () => {
      video.currentTime = 1; // Seek to 1 second to avoid black frames
    };

    video.onseeked = () => {
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      context.drawImage(video, 0, 0, video.videoWidth, video.videoHeight);
      URL.revokeObjectURL(video.src); // Clean up the object URL
      resolve(canvas.toDataURL("image/jpeg"));
    };

    video.onerror = () => {
      URL.revokeObjectURL(video.src);
      resolve(""); // Resolve with an empty string on error
    };
  });
};

function PostUpload() {
  const navigate = useNavigate();
  const form = useFormContext();

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isDraggingVideo, setIsDraggingVideo] = useState(false);

  const images = form.watch("images") || [];
  const videos = form.watch("videos") || [];

  const fileInputRef = useRef(null);
  const videoInputRef = useRef(null);

  const openFilePicker = () => fileInputRef.current?.click();
  const openVideoPicker = () => videoInputRef.current?.click();

  const isImageFile = (file) => file?.type?.startsWith("image/");
  const isVideoFile = (file) => file?.type?.startsWith("video/"); // --- Image Handlers ---

  // --- Image Handlers ---
  const handleAddImages = useCallback(
    (files) => {
      const arr = Array.from(files || []);
      if (!arr.length) return false;

      for (const file of arr) {
        if (!isImageFile(file)) {
          setError(`ไฟล์ "${file.name}" ไม่ใช่รูปภาพที่รองรับ`);
          return false;
        }
        if (file.size > MAX_IMAGE_SIZE) {
          setError(
            `ไฟล์รูปภาพ "${file.name}" ขนาดเกิน ${prettySizeMB(MAX_IMAGE_SIZE)}`
          );
          return false;
        }
      }

      const newFiles = arr.map((file) => ({
        file,
        name: file.name,
        size: file.size,
        preview: URL.createObjectURL(file),
      }));

      const updated = [...images, ...newFiles];
      if (updated.length > MAX_IMAGES) {
        setError(`เพิ่มรูปได้สูงสุด ${MAX_IMAGES} รูป`);
        newFiles.forEach((n) => URL.revokeObjectURL(n.preview));
        return false;
      }

      setError("");
      form.setValue("images", updated, { shouldValidate: true, shouldDirty: true });
      return true;
    },
    [form, images]
  );

  const handleRemoveImage = (index) => {
    URL.revokeObjectURL(images[index].preview);
    const updatedImages = images.filter((_, i) => i !== index);
    form.setValue("images", updatedImages, { shouldDirty: true });
  };

  const handleDropImages = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files?.length) handleAddImages(e.dataTransfer.files);
  };
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = () => setIsDragging(false); // --- Video Handlers ---

  const handleAddVideos = useCallback(
    async (files) => {
      const arr = Array.from(files || []);
      if (!arr.length) return false;

      for (const file of arr) {
        if (!isVideoFile(file)) {
          setError(`ไฟล์ "${file.name}" ไม่ใช่วิดีโอที่รองรับ`);
          return false;
        }
        if (file.size > MAX_VIDEO_SIZE) {
          setError(
            `ไฟล์วิดีโอ "${file.name}" ขนาดเกิน ${prettySizeMB(MAX_VIDEO_SIZE)}`
          );
          return false;
        }
      }

      const newFilesPromises = arr.map(async (file) => {
        const thumbnail = await generateVideoThumbnail(file);
        return {
          file,
          name: file.name,
          size: file.size,
          preview: URL.createObjectURL(file),
          thumbnail,
        };
      });

      const newFiles = await Promise.all(newFilesPromises);

      const updated = [...videos, ...newFiles];
      if (updated.length > MAX_VIDEOS) {
        setError(`เพิ่มวิดีโอได้สูงสุด ${MAX_VIDEOS} ไฟล์`);
        newFiles.forEach((n) => URL.revokeObjectURL(n.preview));
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
    URL.revokeObjectURL(videos[index].preview);
    const updatedVideos = videos.filter((_, i) => i !== index);
    form.setValue("videos", updatedVideos, { shouldDirty: true });
  };

  const handleDropVideos = (e) => {
    e.preventDefault();
    setIsDraggingVideo(false);
    if (e.dataTransfer.files?.length) handleAddVideos(e.dataTransfer.files);
  };
  const handleDragOverVideo = (e) => {
    e.preventDefault();
    setIsDraggingVideo(true);
  };
  const handleDragLeaveVideo = () => setIsDraggingVideo(false); // --- Effects & Submission ---

  useEffect(() => {
    return () => {
      [...images, ...videos].forEach(
        (media) => media?.preview && URL.revokeObjectURL(media.preview)
      );
    };
  }, []);

  const canAddMoreImages = images.length < MAX_IMAGES;
  const canAddMoreVideos = videos.length < MAX_VIDEOS;

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

    (allData.images || []).forEach((img) =>
      formData.append("images", img.file)
    );
    (allData.videos || []).forEach((vid) =>
      formData.append("videos", vid.file)
    );

    for (const key in allData) {
      if (key === "images" || key === "videos") continue;
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
      const response = await createpost(formData);
      form.reset();
      navigate("/seller/post-for-sale/confirm", {
        state: { postId: response.id },
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
              <h2 className="text-2xl font-semibold mt-1">อัปโหลดสื่อ</h2>

              <p className="text-muted-foreground text-sm">
                อัปโหลดรูปภาพและวิดีโอสำหรับประกาศของคุณ
              </p>
            </div>

            {/* ==================== IMAGE UPLOADER ==================== */}

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary" />

                <h3 className="font-semibold">
                  รูปภาพ (สูงสุด {MAX_IMAGES} รูป, ไฟล์ละไม่เกิน
                  {prettySizeMB(MAX_IMAGE_SIZE)})
                </h3>
              </div>
              {/* Dropzone for images */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => (canAddMoreImages ? openFilePicker() : null)}
                onKeyDown={(e) =>
                  e.key === "Enter" || e.key === " " ? openFilePicker() : null
                }
                onDrop={handleDropImages}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                className={`rounded-xl border-2 border-dashed transition-colors p-6 md:p-8 text-center ${
                  canAddMoreImages
                    ? "cursor-pointer hover:bg-primary/10"
                    : "opacity-60 cursor-not-allowed"
                } ${
                  isDragging
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
                  accept="image/*"
                  multiple
                  onChange={(e) => {
                    if (handleAddImages(e.target.files)) e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>
              {/* Preview grid for images */}
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

            {/* ==================== VIDEO UPLOADER ==================== */}

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-2">
                <VideoIcon className="w-5 h-5 text-primary" />

                <h3 className="font-semibold">
                  วิดีโอ (สูงสุด {MAX_VIDEOS} ไฟล์, ไฟล์ละไม่เกิน
                  {prettySizeMB(MAX_VIDEO_SIZE)})
                </h3>
              </div>
              {/* Dropzone for videos */}
              <div
                role="button"
                tabIndex={0}
                onClick={() => (canAddMoreVideos ? openVideoPicker() : null)}
                onKeyDown={(e) =>
                  e.key === "Enter" || e.key === " " ? openVideoPicker() : null
                }
                onDrop={handleDropVideos}
                onDragOver={handleDragOverVideo}
                onDragLeave={handleDragLeaveVideo}
                className={`rounded-xl border-2 border-dashed transition-colors p-6 md:p-8 text-center ${
                  canAddMoreVideos
                    ? "cursor-pointer hover:bg-primary/10"
                    : "opacity-60 cursor-not-allowed"
                } ${
                  isDraggingVideo
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
                  accept="video/*"
                  multiple
                  onChange={(e) => {
                    if (handleAddVideos(e.target.files)) e.target.value = "";
                  }}
                  className="hidden"
                />
              </div>
              {/* Preview grid for videos */}
              {!!videos.length && (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {videos.map((vid, idx) => (
                    <div
                      key={idx}
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

export default PostUpload;
