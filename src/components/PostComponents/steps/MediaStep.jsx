// components/MediaStep.jsx
import React, {
  useEffect,
  useMemo,
  useRef,
  useState,
  useCallback,
} from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Image as ImageIcon,
  Video as VideoIcon,
  Trash2,
  XCircle,
  CheckCircle2,
} from "lucide-react";

/* ================== Config ================== */
const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_IMAGES = 5;
const MAX_VIDEO_SIZE = 50 * 1024 * 1024; // 50MB
const MAX_VIDEOS = 2;

const ACCEPT_IMAGES = ["image/jpeg", "image/png", "image/webp"];
const ACCEPT_VIDEOS = ["video/mp4", "video/quicktime", "video/webm"];

const prettySizeMB = (bytes) => (bytes / (1024 * 1024)).toFixed(2) + " MB";
const uid = () => Math.random().toString(36).slice(2) + Date.now().toString(36);

/** สร้าง thumbnail จากไฟล์วิดีโอ */
const generateVideoThumbnail = (videoFile) => {
  return new Promise((resolve) => {
    if (!videoFile?.type?.startsWith?.("video/")) return resolve("");
    const video = document.createElement("video");
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");

    const url = URL.createObjectURL(videoFile);
    video.src = url;
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
      ctx.drawImage(video, 0, 0, w, h);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg"));
    };
    video.onerror = () => {
      URL.revokeObjectURL(url);
      resolve("");
    };
  });
};

/** ดึง id ที่ไว้ระบุสื่อเดิม (ใช้ public_id เป็นหลัก ถ้าไม่มีใช้ url) */
const mediaId = (m) =>
  m?.public_id ||
  m?.asset_id ||
  m?.id ||
  m?._id ||
  m?.url ||
  m?.secure_url ||
  String(Math.random());

export default function MediaStep({
  serverData,
  /* ไฟล์ใหม่ (ควรเป็น Array<File>) */
  newImages,
  setNewImages,
  newVideos,
  setNewVideos,
  /* คีย์ไว้รีเซ็ต input file */
  resetKey,
  /* (ออปชัน) id ของไฟล์เดิมที่ติ๊กจะลบ + setter (ถ้าไม่ส่งมา จะใช้ state ภายในแทน) */
  removedOldImages,
  setRemovedOldImages,
  removedOldVideos,
  setRemovedOldVideos,
}) {
  const oldImages = serverData?.Image || [];
  const oldVideos = serverData?.Video || [];

  /* ---------- state ภายใน (fallback ถ้า parent ไม่ส่งมา) ---------- */
  const [_rmImgs, _setRmImgs] = useState([]);
  const [_rmVids, _setRmVids] = useState([]);

  const removedImgIds = removedOldImages ?? _rmImgs;
  const removedVidIds = removedOldVideos ?? _rmVids;
  const setRemovedImgIds = setRemovedOldImages ?? _setRmImgs;
  const setRemovedVidIds = setRemovedOldVideos ?? _setRmVids;

  /* ---------- สร้าง preview ของไฟล์ใหม่ ---------- */
  const [imagePreviews, setImagePreviews] = useState([]);
  const [videoPreviews, setVideoPreviews] = useState([]);
  const [error, setError] = useState("");

  // เก็บ objectURL เพื่อ revoke ตอนเปลี่ยน/Unmount
  const urlBinRef = useRef(new Set());

  const makeImagePreview = useCallback((file) => {
    const preview = URL.createObjectURL(file);
    urlBinRef.current.add(preview);
    return {
      id: uid(),
      name: file.name,
      size: file.size,
      preview,
      file,
    };
  }, []);

  const makeVideoPreview = useCallback(async (file) => {
    const preview = URL.createObjectURL(file);
    urlBinRef.current.add(preview);
    const thumbnail = await generateVideoThumbnail(file);
    return {
      id: uid(),
      name: file.name,
      size: file.size,
      preview,
      thumbnail,
      file,
    };
  }, []);

  // เมื่อ newImages เปลี่ยน -> สร้าง preview ใหม่
  useEffect(() => {
    // เคลียร์ของเก่า
    imagePreviews.forEach((p) => {
      if (p.preview) {
        try {
          URL.revokeObjectURL(p.preview);
        } catch {}
        urlBinRef.current.delete(p.preview);
      }
    });
    (async () => {
      const arr = Array.from(newImages || []);
      const previews = arr.map((f) => makeImagePreview(f));
      const resolved = await Promise.all(previews);
      setImagePreviews(resolved);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newImages, resetKey]);

  // เมื่อ newVideos เปลี่ยน -> สร้าง preview ใหม่
  useEffect(() => {
    videoPreviews.forEach((p) => {
      if (p.preview) {
        try {
          URL.revokeObjectURL(p.preview);
        } catch {}
        urlBinRef.current.delete(p.preview);
      }
    });
    (async () => {
      const arr = Array.from(newVideos || []);
      const previews = await Promise.all(arr.map((f) => makeVideoPreview(f)));
      setVideoPreviews(previews);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [newVideos, resetKey]);

  // Cleanup ทั้งหมดตอน unmount
  useEffect(() => {
    return () => {
      imagePreviews.forEach((p) => {
        try {
          URL.revokeObjectURL(p.preview);
        } catch {}
      });
      videoPreviews.forEach((p) => {
        try {
          URL.revokeObjectURL(p.preview);
        } catch {}
      });
      urlBinRef.current.forEach((u) => {
        try {
          URL.revokeObjectURL(u);
        } catch {}
      });
      urlBinRef.current.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /* ---------- Handlers: ลบของเดิม (ติ๊ก/ยกเลิก) ---------- */
  const toggleRemoveOldImage = (m) => {
    const id = mediaId(m);
    setRemovedImgIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const toggleRemoveOldVideo = (m) => {
    const id = mediaId(m);
    setRemovedVidIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };
  const isMarkedRemoveImg = (m) => removedImgIds.includes(mediaId(m));
  const isMarkedRemoveVid = (m) => removedVidIds.includes(mediaId(m));

  /* ---------- Handlers: เพิ่ม/ลบไฟล์ใหม่ ---------- */
  const isAllowedImage = (file) => ACCEPT_IMAGES.includes(file?.type);
  const isAllowedVideo = (file) => ACCEPT_VIDEOS.includes(file?.type);

  const handleAddImages = (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    // validate
    for (const f of arr) {
      if (!isAllowedImage(f)) {
        setError(`"${f.name}" ไม่ใช่ชนิดรูปที่รองรับ (jpeg/png/webp)`);
        return;
      }
      if (f.size > MAX_IMAGE_SIZE) {
        setError(`"${f.name}" ขนาดเกิน ${prettySizeMB(MAX_IMAGE_SIZE)}`);
        return;
      }
    }
    const next = [...(newImages || []), ...arr];
    if (next.length > MAX_IMAGES) {
      setError(`เพิ่มรูปได้สูงสุด ${MAX_IMAGES} รูป`);
      return;
    }
    setError("");
    setNewImages(next);
  };

  const handleAddVideos = async (files) => {
    const arr = Array.from(files || []);
    if (!arr.length) return;
    for (const f of arr) {
      if (!isAllowedVideo(f)) {
        setError(`"${f.name}" ไม่ใช่ชนิดวิดีโอที่รองรับ (mp4/mov/webm)`);
        return;
      }
      if (f.size > MAX_VIDEO_SIZE) {
        setError(`"${f.name}" ขนาดเกิน ${prettySizeMB(MAX_VIDEO_SIZE)}`);
        return;
      }
    }
    const next = [...(newVideos || []), ...arr];
    if (next.length > MAX_VIDEOS) {
      setError(`เพิ่มวิดีโอได้สูงสุด ${MAX_VIDEOS} ไฟล์`);
      return;
    }
    setError("");
    setNewVideos(next);
  };

  const handleRemoveNewImage = (idx) => {
    const next = (newImages || []).filter((_, i) => i !== idx);
    setNewImages(next);
  };
  const handleRemoveNewVideo = (idx) => {
    const next = (newVideos || []).filter((_, i) => i !== idx);
    setNewVideos(next);
  };

  /* ---------- UI ---------- */
  const canAddMoreImages = (newImages?.length || 0) < MAX_IMAGES;
  const canAddMoreVideos = (newVideos?.length || 0) < MAX_VIDEOS;

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* ====== สื่อเดิม ====== */}
      <Card className="shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">สื่อเดิม (รูป & วิดีโอ)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* รูปเดิม */}
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5" />
              <h4 className="font-medium">รูปภาพเดิม</h4>
            </div>

            {oldImages.length ? (
              <div className="grid grid-cols-3 gap-3">
                {oldImages.map((img, i) => {
                  const src = img.secure_url || img.url;
                  const marked = isMarkedRemoveImg(img);
                  return (
                    <div
                      key={`${src}-${i}-${resetKey}`}
                      className={`relative rounded-lg overflow-hidden border ${
                        marked ? "opacity-60" : ""
                      }`}
                    >
                      <img
                        src={src}
                        alt="old-img"
                        className="w-full h-24 object-cover"
                      />
                      {/* toggle remove */}
                      <button
                        type="button"
                        onClick={() => toggleRemoveOldImage(img)}
                        className={`absolute top-1.5 right-1.5 rounded-full p-1.5 shadow transition
                          ${
                            marked
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        aria-label={marked ? "ยกเลิกลบรูป" : "ลบรูปนี้"}
                        title={marked ? "ยกเลิกลบรูป" : "ลบรูปนี้"}
                      >
                        {marked ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>

                      {marked && (
                        <div className="absolute inset-0 bg-black/40 grid place-content-center text-white text-xs">
                          จะลบ
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <ImageIcon className="w-5 h-5 mr-2" />
                ไม่มีรูปภาพเดิม
              </div>
            )}
          </div>

          {/* วิดีโอเดิม */}
          <div className="space-y-2 pt-2">
            <div className="flex items-center gap-2">
              <VideoIcon className="w-5 h-5" />
              <h4 className="font-medium">วิดีโอเดิม</h4>
            </div>

            {oldVideos.length ? (
              <div className="grid grid-cols-2 gap-3">
                {oldVideos.map((vid, i) => {
                  const src = vid.secure_url || vid.url;
                  const marked = isMarkedRemoveVid(vid);
                  return (
                    <div
                      key={`${src}-${i}-${resetKey}`}
                      className={`relative rounded-lg overflow-hidden border ${
                        marked ? "opacity-60" : ""
                      }`}
                    >
                      <video
                        src={src}
                        className="w-full h-28 object-cover bg-black"
                        controls
                      />
                      <button
                        type="button"
                        onClick={() => toggleRemoveOldVideo(vid)}
                        className={`absolute top-1.5 right-1.5 rounded-full p-1.5 shadow transition
                          ${
                            marked
                              ? "bg-green-600 text-white"
                              : "bg-red-600 text-white"
                          }`}
                        aria-label={marked ? "ยกเลิกลบวิดีโอ" : "ลบวิดีโอนี้"}
                        title={marked ? "ยกเลิกลบวิดีโอ" : "ลบวิดีโอนี้"}
                      >
                        {marked ? (
                          <CheckCircle2 size={16} />
                        ) : (
                          <Trash2 size={16} />
                        )}
                      </button>
                      {marked && (
                        <div className="absolute inset-0 bg-black/40 grid place-content-center text-white text-xs">
                          จะลบ
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                <VideoIcon className="w-5 h-5 mr-2" />
                ไม่มีวิดีโอเดิม
              </div>
            )}
          </div>

          <p className="text-xs text-gray-500">
            *ถ้าไม่อัปโหลดใหม่ ระบบจะคงสื่อเดิมไว้ (ยกเว้นรายการที่ติ๊ก “จะลบ”)
          </p>
        </CardContent>
      </Card>

      {/* ====== อัปโหลดไฟล์ใหม่ ====== */}
      <Card className="shadow-sm">
        <CardHeader className="py-4">
          <CardTitle className="text-lg">อัปโหลดไฟล์ใหม่ (ไม่บังคับ)</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* รูปภาพใหม่ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block font-medium">
                รูปภาพ (สูงสุด {MAX_IMAGES} รูป)
              </label>
              <span className="text-xs text-muted-foreground">
                อัปโหลดแล้ว {newImages?.length || 0} / {MAX_IMAGES}
              </span>
            </div>
            <Input
              key={`newimg-${resetKey}`}
              type="file"
              accept={ACCEPT_IMAGES.join(",")}
              multiple
              onChange={(e) => {
                handleAddImages(e.target.files);
                // เคลียร์ค่า เพื่อเลือกไฟล์ซ้ำชื่อเดิมได้
                e.target.value = "";
              }}
            />

            {!!imagePreviews.length && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {imagePreviews.map((img, idx) => (
                  <div
                    key={img.id}
                    className="relative rounded-lg overflow-hidden border"
                  >
                    <img
                      src={img.preview}
                      alt={img.name || `image-${idx}`}
                      className="w-full h-28 object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewImage(idx)}
                      className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1.5 shadow"
                      aria-label={`ลบรูปใหม่ที่ ${idx + 1}`}
                      title="ลบรูปนี้"
                    >
                      <XCircle size={16} />
                    </button>
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
          </div>

          {/* วิดีโอใหม่ */}
          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <label className="block font-medium">
                วิดีโอ (สูงสุด {MAX_VIDEOS} ไฟล์)
              </label>
              <span className="text-xs text-muted-foreground">
                อัปโหลดแล้ว {newVideos?.length || 0} / {MAX_VIDEOS}
              </span>
            </div>
            <Input
              key={`newvid-${resetKey}`}
              type="file"
              accept={ACCEPT_VIDEOS.join(",")}
              multiple
              onChange={async (e) => {
                await handleAddVideos(e.target.files);
                e.target.value = "";
              }}
            />

            {!!videoPreviews.length && (
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {videoPreviews.map((vid, idx) => (
                  <div
                    key={vid.id}
                    className="relative rounded-lg overflow-hidden border"
                  >
                    <video
                      src={vid.preview}
                      poster={vid.thumbnail}
                      className="w-full h-28 object-cover bg-black"
                      controls
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveNewVideo(idx)}
                      className="absolute top-1.5 right-1.5 bg-red-600 text-white rounded-full p-1.5 shadow"
                      aria-label={`ลบวิดีโอใหม่ที่ ${idx + 1}`}
                      title="ลบวิดีโอนี้"
                    >
                      <XCircle size={16} />
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

          {/* หมายเหตุ */}
          {(newImages?.length > 0 || newVideos?.length > 0) && (
            <p className="text-xs text-gray-500">
              ระบบจะส่งไฟล์ใหม่ด้วย <code>multipart/form-data</code>{" "}
              หลังจากกดบันทึก
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
