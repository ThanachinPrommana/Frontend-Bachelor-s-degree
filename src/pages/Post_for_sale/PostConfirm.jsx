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
import axios from "axios";
import { useFormContext } from "react-hook-form";

/** ใช้ env ก่อน แล้วค่อย fallback localhost */
const API_URL = import.meta.env?.VITE_API_URL || "http://localhost:8200";

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
/** ดอกเบี้ยให้ทนทานต่อค่าว่าง/สตริง */
const fmtInterest = (v) => {
  if (v === null || v === undefined) return "-";
  const s = String(v).trim();
  if (s === "") return "-";
  const n = Number(s);
  return Number.isFinite(n) ? `${n}% / ปี` : "-";
};

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

/** อ่านชื่อ category จาก payload ได้หลายรูปแบบ */
function getCategoryNameFromObject(obj) {
  if (!obj) return null;
  return obj.Property_type || obj.name || obj.title || null;
}
function getCategoryName(postData) {
  return (
    getCategoryNameFromObject(postData?.Category) ||
    getCategoryNameFromObject(postData?.category) ||
    postData?.categoryName ||
    postData?.Propertytype ||
    "-"
  );
}

/** SELL/RENT label (ตอนนี้มีแต่ขาย แต่คง helper ไว้เพื่อ fallback draft/back-end) */
function getSellRent(data) {
  const raw = data?.Sell_Rent;
  if (!raw) return "ขาย (SALE)"; // default เป็นขาย
  const v = String(raw).toUpperCase();
  if (v === "SALE") return "ขาย (SALE)";
  if (v === "RENT") return "ให้เช่า (RENT)";
  return raw;
}

/** ดึง URL ของรูปจากหลายรูปแบบ object — อนุญาตเฉพาะ http(s), data:image/*, blob: */
function getImageUrl(img) {
  if (!img) return null;

  const raw =
    typeof img === "string"
      ? String(img).trim()
      : img.secure_url || img.url || img.path || img.Location || "";

  if (!raw) return null;

  const SAFE_SCHEMES = /^(https?:|data:image\/|blob:)/i;

  // http/https → normalize, ถ้า normalize ไม่ผ่าน (protocol แปลก) ให้ทิ้ง
  if (/^https?:/i.test(raw)) {
    const norm = normalizeUrl(raw);
    return norm || null;
  }

  // อนุญาต data:image/* และ blob:
  return SAFE_SCHEMES.test(raw) ? raw : null;
}

/* ================= UI Partials ================= */
const Row = ({ label, value, right = false }) => (
  <div className="flex justify-between border-b py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`ml-4 ${right ? "text-right" : ""}`}>{value ?? "-"}</span>
  </div>
);

/** ตัดปุ่มแก้ไขออกตามที่ขอ */
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
        const res = await axios.get(`${API_URL}/api/propertypost/${postId}`, {
          signal: controller.signal,
          withCredentials: true,
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

  // resolve ชื่อประเภททรัพย์ (ถ้า payload ไม่มี)
  useEffect(() => {
    if (!postData) return;

    const nameNow = getCategoryName(postData);
    if (nameNow && nameNow !== "-") {
      setResolvedCategoryName(nameNow);
      return;
    }

    const cid =
      postData?.categoryId || postData?.Category?.id || postData?.category?.id;
    if (!cid) return;

    const controller = new AbortController();
    axios
      .get(`${API_URL}/api/category/${cid}`, {
        signal: controller.signal,
        withCredentials: true,
      })
      .then((r) => {
        const n =
          getCategoryNameFromObject(r.data) ||
          r.data?.name ||
          r.data?.categoryName ||
          "-";
        setResolvedCategoryName(n || "-");
      })
      .catch(() => setResolvedCategoryName("-"));

    return () => controller.abort();
  }, [postData]);

  // ใช้ค่าจาก backend ถ้ามี ไม่งั้น fallback เป็น draft จากฟอร์ม
  const sellRentView = useMemo(
    () => getSellRent(postData) || getSellRent(draft),
    [postData, draft]
  );

  const handleSubmit = async () => {
    if (submitting) return;
    setSubmitting(true);
    try {
      // ตัวอย่าง: อัปเดตสถานะ ถ้าพร้อมเปิดใช้
      // await axios.patch(`${API_URL}/api/propertypost/${postId}`, { Status_post: "PENDING_REVIEW" }, { withCredentials: true });
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

  // รองรับได้ทั้ง Image/Images/images และทั้ง string/object
  const rawImages =
    postData?.images || postData?.Images || postData?.Image || [];
  const images = Array.isArray(rawImages)
    ? rawImages.map((it) => getImageUrl(it)).filter(Boolean)
    : [];
  const hasImages = images.length > 0;

  return (
    <PostLayout currentStep={6}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardHeader className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            {/* ✅ เปลี่ยนหัวข้อเป็นโทน “ผลลัพธ์/สรุปก่อนเผยแพร่” */}
            <CardTitle className="text-2xl font-semibold mt-1">
              สรุปข้อมูลประกาศก่อนเผยแพร่
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              โปรดตรวจสอบความถูกต้องของข้อมูลด้านล่าง หากเรียบร้อยแล้วกด
              <span className="font-medium"> “ส่งประกาศ”</span>
            </p>
          </CardHeader>

          <CardContent className="space-y-8 px-6 md:px-8 pb-8">
            {/* Helper banner (อธิบายขั้นตอนต่อไป) */}
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

            {/* ราคา (ระบบมีแต่ขาย) */}
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
                  label="ดอกเบี้ยโดยประมาณ"
                  value={fmtInterest(postData?.Interest ?? draft?.Interest)}
                  right
                />
                <Row
                  label="ค่าใช้จ่ายอื่น ๆ"
                  value={
                    postData?.Other_related_expenses ??
                    draft?.Other_related_expenses ??
                    "-"
                  }
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
                      {url ? (
                        <img
                          src={url}
                          alt={`property-${idx}`}
                          className="w-full h-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      ) : (
                        <div className="flex items-center justify-center h-full text-muted-foreground bg-muted">
                          <ImageIcon className="w-5 h-5" />
                        </div>
                      )}
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

            {/* ปุ่มยืนยัน (ไม่มีปุ่มย้อนกลับ/แก้ไขแล้ว) */}
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
