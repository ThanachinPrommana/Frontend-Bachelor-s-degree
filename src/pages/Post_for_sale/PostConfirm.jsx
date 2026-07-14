// src/pages/Post_for_sale/PostConfirm.jsx
import PostLayout from "@/layouts/PostLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Image as ImageIcon, Loader2, Info } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import { apiClient } from "@/api/authconfig";
import { useFormContext } from "react-hook-form";

const nfBaht = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
const nfArea = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });

/* ================= helpers ================= */
function fmtBaht(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return `${nfBaht.format(n)} บาท`;
}
function fmtNumber(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(v);
  if (Number.isNaN(n)) return "-";
  return nfArea.format(n);
}
function fmtYear(v) {
  if (v === null || v === undefined || v === "") return "-";
  const n = Number(String(v).trim());
  if (!Number.isFinite(n) || n < 1800) return "-";
  return String(n);
}
function safeJoin(arr, sep = ", ") {
  return Array.isArray(arr) && arr.length ? arr.join(sep) : "-";
}

/** sanitize url: เติม https:// และบังคับให้เป็น http/https เท่านั้น */
function normalizeUrl(val) {
  if (!val) return "";
  const raw = String(val).trim();
  if (!raw) return "";
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (!/^https?:$/i.test(u.protocol)) return "";
    return u.toString();
  } catch {
    return "";
  }
}

/** SELL/RENT label */
function getSellRent(data) {
  const raw = data?.Sell_Rent;
  if (!raw) return "ขาย (SALE)";
  const v = String(raw).toUpperCase();
  if (v === "SALE") return "ขาย (SALE)";
  if (v === "RENT") return "ให้เช่า (RENT)";
  return raw;
}

/** ดึง URL ของรูป: รองรับ object จาก backend และ wrapper จากฟอร์ม (มี preview/file) */
function getImageUrl(img) {
  if (!img) return null;

  // พรีวิวจากฟอร์ม (PostUpload.jsx เก็บไว้เป็น { file, preview, ... })
  if (typeof img === "object" && img.preview) {
    return String(img.preview).trim() || null;
  }

  const raw =
    typeof img === "string"
      ? String(img).trim()
      : img.secure_url || img.url || img.path || img.Location || "";

  if (!raw) return null;

  const SAFE_SCHEMES = /^(https?:|data:image\/|blob:)/i;

  if (/^https?:/i.test(raw)) {
    const norm = normalizeUrl(raw);
    return norm || null;
  }
  return SAFE_SCHEMES.test(raw) ? raw : null;
}

/** ดึง URL ของวิดีโอ: logic ใกล้เคียงกับรูป และรองรับ blob/data */
function getVideoUrl(v) {
  if (!v) return null;

  if (typeof v === "object" && v.preview) {
    // draft.videos เก็บ preview (blob/objectURL)
    return String(v.preview).trim() || null;
  }

  const raw =
    typeof v === "string"
      ? String(v).trim()
      : v.secure_url || v.url || v.path || v.Location || "";

  if (!raw) return null;

  const SAFE_SCHEMES = /^(https?:|blob:|data:video\/)/i;

  if (/^https?:/i.test(raw)) {
    const norm = normalizeUrl(raw);
    return norm || null;
  }
  return SAFE_SCHEMES.test(raw) ? raw : null;
}

/* ================= UI Partials ================= */
const Row = ({ label, value, right = false }) => (
  <div className="flex justify-between border-b py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`ml-4 ${right ? "text-right" : ""}`}>{value ?? "-"}</span>
  </div>
);

const Section = ({ title, children }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <h3 className="font-semibold text-lg">{title}</h3>
    </div>
    {children}
  </div>
);

const PostConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const form = useFormContext?.();
  const draft = form?.getValues?.() || {}; // fallback ค่าจากฟอร์ม

  const [showConfirm, setShowConfirm] = useState(false);
  const [postData, setPostData] = useState(null);
  const [resolvedCategoryName, setResolvedCategoryName] = useState("-");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // รองรับกรณี refresh หน้า: ดึง id จาก query ได้ด้วย
  const urlId = new URLSearchParams(location.search).get("id");
  const postId = location.state?.postId || urlId;

  // fetch post data
  useEffect(() => {
    if (!postId) {
      setError("ไม่พบ ID โพสต์ กรุณาลองใหม่");
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    (async () => {
      try {
        const res = await apiClient.get(`/propertypost/${postId}`, {
          signal: controller.signal,
        });
        setPostData(res.data);
      } catch (err) {
        if (axios.isCancel?.(err)) return;
        console.error("Failed to fetch post data:", err);
        setError("ไม่สามารถดึงข้อมูลโพสต์ได้");
      } finally {
        setIsLoading(false);
      }
    })();

    return () => controller.abort();
  }, [postId]);

  // resolve ชื่อประเภททรัพย์จาก payload โดยตรง
  useEffect(() => {
    if (!postData) return;
    const nameNow =
      postData?.Category?.name ||
      postData?.Category?.Property_type ||
      draft?.Category?.name ||
      draft?.categoryName ||
      "-";
    setResolvedCategoryName(nameNow || "-");
  }, [postData, draft]);

  // ใช้ค่าจาก backend ถ้ามี ไม่งั้น fallback เป็น draft จากฟอร์ม
  const sellRentView = useMemo(
    () => getSellRent(postData) || getSellRent(draft),
    [postData, draft]
  );

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // ถ้าจะเปลี่ยนสถานะหลังยืนยัน:
      // await axios.patch(`${API_URL}/api/propertypost/${postId}`, { Status_post: "PENDING" }, { withCredentials: true });
      navigate("/seller");
    } catch (e) {
      console.warn("Failed to set status:", e);
    } finally {
      setShowConfirm(false);
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <PostLayout currentStep={6}>
        <div className="flex flex-col items-center justify-center h-96 gap-3">
          <Loader2 className="w-10 h-10 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">กำลังโหลดข้อมูล...</p>
        </div>
      </PostLayout>
    );
  }

  if (error) {
    return (
      <PostLayout currentStep={6}>
        <div className="flex items-center justify-center h-96">
          <div className="rounded-md border border-red-200 bg-red-50 px-4 py-3 text-red-700">
            {error}
          </div>
        </div>
      </PostLayout>
    );
  }

  if (!postData) return null;

  /** ============ รูปภาพ ============
   *  1) พยายามใช้รูปจาก backend: postData.Image (array ของ {url, secure_url})
   *  2) ถ้าไม่มี ให้ fallback เป็นรูปพรีวิวจากฟอร์ม: draft.images (array ของ { preview, file, ... })
   */
  const backendImages = Array.isArray(postData?.Image)
    ? postData.Image.map((it) => getImageUrl(it)).filter(Boolean)
    : [];

  const draftImages = Array.isArray(draft?.images)
    ? draft.images.map((it) => getImageUrl(it)).filter(Boolean)
    : [];

  const images = backendImages.length > 0 ? backendImages : draftImages;
  const hasImages = images.length > 0;

  /** ============ วิดีโอ ============
   *  รองรับทั้ง postData.Video / postData.Videos และ draft.videos
   */
  const backendVideosRaw = Array.isArray(postData?.Video)
    ? postData.Video
    : Array.isArray(postData?.Videos)
    ? postData.Videos
    : [];

  const backendVideos = backendVideosRaw
    .map((it) => getVideoUrl(it))
    .filter(Boolean);

  const draftVideos = Array.isArray(draft?.videos)
    ? draft.videos.map((it) => getVideoUrl(it)).filter(Boolean)
    : [];

  const videos = backendVideos.length > 0 ? backendVideos : draftVideos;
  const hasVideos = videos.length > 0;

  return (
    <PostLayout currentStep={6}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardHeader className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <CardTitle className="text-2xl font-semibold mt-1">
              สรุปข้อมูลประกาศก่อนเผยแพร่
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              โปรดตรวจสอบความถูกต้องของข้อมูลด้านล่าง หากเรียบร้อยแล้วกด
              <span className="font-medium"> “ส่งประกาศ”</span>
            </p>
          </CardHeader>

          <CardContent className="space-y-8 px-6 md:px-8 pb-8">
            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                หลังจากส่งประกาศ
                ระบบจะเข้าสู่ขั้นตอนตรวจสอบโดยผู้ดูแลและจะเผยแพร่ภายใน{" "}
                <span className="font-medium">24 ชั่วโมงทำการ</span>
              </p>
            </div>

            {/* ข้อมูลประกาศ */}
            <Section title="ข้อมูลประกาศ">
              <div className="space-y-1">
                <Row
                  label="หัวข้อ"
                  value={postData?.Property_Name ?? draft?.Property_Name ?? "-"}
                />
                <Row
                  label="รายละเอียด"
                  value={postData?.Description ?? draft?.Description ?? "-"}
                />
                <Row label="ประเภททรัพย์" value={resolvedCategoryName} />
              </div>
            </Section>

            {/* ที่ตั้ง */}
            <Section title="ที่ตั้ง">
              <div className="space-y-1">
                <Row
                  label="ที่อยู่"
                  value={postData?.Address ?? draft?.Address ?? "-"}
                />
                <Row
                  label="จังหวัด"
                  value={postData?.Province ?? draft?.Province ?? "-"}
                />
                <Row
                  label="อำเภอ/เขต"
                  value={postData?.District ?? draft?.District ?? "-"}
                />
                <Row
                  label="ตำบล/แขวง"
                  value={postData?.Subdistrict ?? draft?.Subdistrict ?? "-"}
                />
                <Row
                  label="ลิงก์แผนที่"
                  value={
                    (postData?.LinkMap ?? draft?.LinkMap) &&
                    normalizeUrl(postData?.LinkMap ?? draft?.LinkMap) ? (
                      <a
                        href={normalizeUrl(postData?.LinkMap ?? draft?.LinkMap)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        เปิดแผนที่
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
              </div>
            </Section>

            {/* รายละเอียดทรัพย์ */}
            <Section title="รายละเอียดทรัพย์">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Row
                  label="พื้นที่ใช้สอย"
                  value={
                    (postData?.Usable_Area ?? draft?.Usable_Area) != null
                      ? `${fmtNumber(
                          postData?.Usable_Area ?? draft?.Usable_Area
                        )} ตร.ม.`
                      : "-"
                  }
                />
                <Row
                  label="พื้นที่ดิน"
                  value={
                    (postData?.Land_Size ?? draft?.Land_Size) != null
                      ? `${fmtNumber(
                          postData?.Land_Size ?? draft?.Land_Size
                        )} ตร.วา`
                      : "-"
                  }
                />
                <Row
                  label="ปีที่สร้าง"
                  value={fmtYear(postData?.Year_Built ?? draft?.Year_Built)}
                />
                <Row
                  label="ห้องนอน"
                  value={fmtNumber(postData?.Bedrooms ?? draft?.Bedrooms)}
                />
                <Row
                  label="ห้องน้ำ"
                  value={fmtNumber(postData?.Bathroom ?? draft?.Bathroom)}
                />
                <Row
                  label="จำนวนห้องทั้งหมด"
                  value={fmtNumber(postData?.Total_Rooms ?? draft?.Total_Rooms)}
                />
                <Row
                  label="ที่จอดรถ"
                  value={fmtNumber(
                    postData?.Parking_Space ?? draft?.Parking_Space
                  )}
                />
                <div className="md:col-span-3">
                  <Row
                    label="สถานที่ใกล้เคียง"
                    value={safeJoin(
                      postData?.Nearby_Landmarks ?? draft?.Nearby_Landmarks
                    )}
                  />
                </div>
                <div className="md:col-span-3">
                  <Row
                    label="สิ่งอำนวยความสะดวก"
                    value={safeJoin(
                      postData?.Additional_Amenities ??
                        draft?.Additional_Amenities
                    )}
                  />
                </div>
              </div>
            </Section>

            {/* ราคา */}
            <Section title="ราคา">
              <div className="space-y-1">
                <Row label="ประเภทประกาศ" value={sellRentView} />
                <Row
                  label="ราคาขาย"
                  value={fmtBaht(postData?.Price ?? draft?.Price)}
                  right
                />
                <Row
                  label="เงินดาวน์"
                  value={fmtBaht(
                    postData?.Deposit_Amount ?? draft?.Deposit_Amount
                  )}
                  right
                />
                <Row
                  label="ค่าใช้จ่ายอื่น ๆ"
                  value={safeJoin(
                    postData?.Other_related_expenses ??
                      draft?.Other_related_expenses
                  )}
                />
              </div>
            </Section>

            {/* ผู้ขาย */}
            <Section title="ข้อมูลผู้ขาย">
              <div className="space-y-1">
                <Row
                  label="ชื่อผู้ขาย"
                  value={postData?.Name ?? draft?.Name ?? "-"}
                />
                <Row
                  label="เบอร์โทร"
                  value={postData?.Phone ?? draft?.Phone ?? "-"}
                />
                <Row
                  label="LINE"
                  value={
                    (postData?.Link_line ?? draft?.Link_line) &&
                    normalizeUrl(postData?.Link_line ?? draft?.Link_line) ? (
                      <a
                        href={normalizeUrl(
                          postData?.Link_line ?? draft?.Link_line
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        เปิดลิงก์ LINE
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
                <Row
                  label="Facebook"
                  value={
                    (postData?.Link_facbook ?? draft?.Link_facbook) &&
                    normalizeUrl(
                      postData?.Link_facbook ?? draft?.Link_facbook
                    ) ? (
                      <a
                        href={normalizeUrl(
                          postData?.Link_facbook ?? draft?.Link_facbook
                        )}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary underline underline-offset-2"
                      >
                        เปิด Facebook
                      </a>
                    ) : (
                      "-"
                    )
                  }
                />
              </div>
            </Section>

            {/* รูปภาพ */}
            <Section title="รูปภาพประกาศ">
              {hasImages ? (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((url, idx) => (
                    <div
                      key={url || idx}
                      className="relative w-full aspect-square rounded-lg overflow-hidden ring-1 ring-black/5"
                    >
                      <img
                        src={url}
                        alt={`property-${idx}`}
                        className="w-full h-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute left-2 top-2 text-xs px-2 py-0.5 rounded-full bg-black/60 text-white">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> ไม่มีรูปภาพ
                </div>
              )}
            </Section>

            {/* วิดีโอ */}
            <Section title="วิดีโอประกาศ">
              {hasVideos ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {videos.map((url, idx) => (
                    <div
                      key={url || idx}
                      className="relative w-full aspect-video rounded-lg overflow-hidden ring-1 ring-black/5 bg-black"
                    >
                      <video
                        src={url}
                        controls
                        className="w-full h-full"
                        preload="metadata"
                      />
                      <div className="absolute left-2 top-2 text-xs px-2 py-0.5 rounded-full bg-black/60 text-white">
                        {idx + 1}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">ไม่มีวิดีโอ</p>
              )}
            </Section>

            {/* ปุ่มยืนยัน */}
            <div className="flex justify-end pt-2">
              <Button
                onClick={() => setShowConfirm(true)}
                className="min-w-[160px]"
              >
                ส่งประกาศ
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal ยืนยัน */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ประกาศถูกส่งรอการอนุมัติ</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            ระบบกำลังตรวจสอบประกาศของคุณ คุณจะเห็นประกาศบนหน้าเว็บภายใน 24
            ชั่วโมงทำการ
          </p>
          <AlertDialogFooter>
            <AlertDialogAction onClick={handleSubmit} disabled={submitting}>
              {submitting ? "กำลังบันทึก..." : "ตกลง"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PostLayout>
  );
};

export default PostConfirm;
