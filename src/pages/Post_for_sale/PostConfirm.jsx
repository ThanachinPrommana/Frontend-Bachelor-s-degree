// src/pages/Post_for_sale/PostConfirm.jsx
import PostLayout from "@/layouts/PostLayout";
import { Button } from "@/components/ui/button";
import { useNavigate, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Edit, ImageIcon, Loader2, Info } from "lucide-react";
import { useState, useEffect, useMemo } from "react";
import {
  AlertDialog,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogFooter,
  AlertDialogCancel,
  AlertDialogAction,
} from "@/components/ui/alert-dialog";
import axios from "axios";

const API_URL = "http://localhost:8200";

const nfBaht = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 });
const nfArea = new Intl.NumberFormat("th-TH", { maximumFractionDigits: 2 });

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
  if (!v && v !== 0) return "-";
  const n = Number(v);
  if (Number.isNaN(n) || n < 1800) return "-";
  return String(n);
}
function safeJoin(arr, sep = ", ") {
  return Array.isArray(arr) && arr.length ? arr.join(sep) : "-";
}

/** พยายามแสดงชื่อประเภททรัพย์จากหลายรูปแบบของ API */
function getCategoryName(postData) {
  return (
    postData?.Category?.Property_type ||
    postData?.categoryName || // เผื่อ backend คืนชื่อไว้ตรง ๆ
    postData?.Propertytype || // เคสที่เก็บเป็นตัวแปรนี้
    "-"
  );
}

/** ดูว่าโพสต์เป็นขายหรือเช่า */
function getSellRent(postData) {
  const raw = postData?.Sell_Rent;
  if (!raw) return "-";
  const v = String(raw).toUpperCase();
  if (v === "SALE") return "ขาย (SALE)";
  if (v === "RENT") return "ให้เช่า (RENT)";
  return raw;
}

const Row = ({ label, value, right = false }) => (
  <div className="flex justify-between border-b py-2 text-sm">
    <span className="text-muted-foreground">{label}</span>
    <span className={`ml-4 ${right ? "text-right" : ""}`}>{value ?? "-"}</span>
  </div>
);

const Section = ({ title, onEdit, children }) => (
  <div>
    <div className="flex justify-between items-center mb-2">
      <h3 className="font-semibold text-lg">{title}</h3>
      {onEdit && (
        <Button variant="outline" size="sm" onClick={onEdit}>
          <Edit className="w-4 h-4 mr-1" /> แก้ไข
        </Button>
      )}
    </div>
    {children}
  </div>
);

const PostConfirm = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [showConfirm, setShowConfirm] = useState(false);

  const [postData, setPostData] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  const postId = location.state?.postId;

  useEffect(() => {
    if (!postId) {
      setError("ไม่พบ ID โพสต์ กรุณาลองใหม่");
      setIsLoading(false);
      return;
    }
    (async () => {
      try {
        const res = await axios.get(`${API_URL}/api/propertypost/${postId}`);
        setPostData(res.data);
      } catch (err) {
        console.error("Failed to fetch post data:", err);
        setError("ไม่สามารถดึงข้อมูลโพสต์ได้");
      } finally {
        setIsLoading(false);
      }
    })();
  }, [postId]);

  const sellRentView = useMemo(() => getSellRent(postData), [postData]);

  const handleSubmit = () => {
    // TODO: ทำ action หลังบ้านถ้ามี
    setShowConfirm(false);
    navigate("/");
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

  const images = postData?.Image || postData?.Images || []; // เผื่อชื่อฟิลด์ต่างกัน
  const hasImages = Array.isArray(images) && images.length > 0;

  return (
    <PostLayout currentStep={6}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardHeader className="text-center space-y-2">
            <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <CheckCircle className="w-6 h-6 text-primary" />
            </div>
            <CardTitle className="text-2xl font-semibold mt-1">
              ยืนยันข้อมูล
            </CardTitle>
            <p className="text-muted-foreground text-sm">
              กรุณาตรวจสอบข้อมูลของคุณก่อนโพสต์
            </p>
          </CardHeader>

          <CardContent className="space-y-8 px-6 md:px-8 pb-8">
            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                หากพบข้อมูลไม่ถูกต้อง สามารถกดปุ่ม{" "}
                <span className="font-medium">แก้ไข</span> ในแต่ละหมวด
                แล้วกลับมาหน้านี้อีกครั้งได้
              </p>
            </div>

            {/* ข้อมูลประกาศ */}
            <Section
              title="ข้อมูลประกาศ"
              onEdit={() => navigate("/seller/post-for-sale/title")}
            >
              <div className="space-y-1">
                <Row label="หัวข้อ" value={postData?.Property_Name || "-"} />
                <Row label="รายละเอียด" value={postData?.Description || "-"} />
                <Row label="ประเภททรัพย์" value={getCategoryName(postData)} />
              </div>
            </Section>

            {/* ที่ตั้ง */}
            <Section
              title="ที่ตั้ง"
              onEdit={() => navigate("/seller/post-for-sale/location")}
            >
              <div className="space-y-1">
                <Row label="จังหวัด" value={postData?.Province || "-"} />
                <Row label="อำเภอ/เขต" value={postData?.District || "-"} />
                <Row label="ตำบล/แขวง" value={postData?.Subdistrict || "-"} />
                <Row
                  label="ลิงก์แผนที่"
                  value={
                    postData?.LinkMap ? (
                      <a
                        href={postData.LinkMap}
                        target="_blank"
                        rel="noreferrer"
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
            <Section
              title="รายละเอียดทรัพย์"
              onEdit={() => navigate("/seller/post-for-sale/detail")}
            >
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <Row
                  label="พื้นที่ใช้สอย"
                  value={
                    postData?.Usable_Area
                      ? `${fmtNumber(postData.Usable_Area)} ตร.ม.`
                      : "-"
                  }
                />
                <Row
                  label="พื้นที่ดิน"
                  value={
                    postData?.Land_Size
                      ? `${fmtNumber(postData.Land_Size)} ตร.วา`
                      : "-"
                  }
                />
                <Row label="ปีที่สร้าง" value={fmtYear(postData?.Year_Built)} />
                <Row label="ห้องนอน" value={fmtNumber(postData?.Bedrooms)} />
                <Row label="ห้องน้ำ" value={fmtNumber(postData?.Bathroom)} />
                <Row
                  label="จำนวนห้องทั้งหมด"
                  value={fmtNumber(postData?.Total_Rooms)}
                />
                <Row
                  label="ที่จอดรถ"
                  value={fmtNumber(postData?.Parking_Space)}
                />
                <div className="md:col-span-3">
                  <Row
                    label="สถานที่ใกล้เคียง"
                    value={safeJoin(postData?.Nearby_Landmarks)}
                  />
                </div>
                <div className="md:col-span-3">
                  <Row
                    label="สิ่งอำนวยความสะดวก"
                    value={safeJoin(postData?.Additional_Amenities)}
                  />
                </div>
              </div>
            </Section>

            {/* ราคา */}
            <Section
              title="ราคา"
              onEdit={() => navigate("/seller/post-for-sale/price")}
            >
              <div className="space-y-1">
                <Row label="ประเภทประกาศ" value={sellRentView} />
                {/* แสดงตามประเภท */}
                {String(postData?.Sell_Rent).toUpperCase() === "RENT" ? (
                  <>
                    <Row
                      label="ค่าเช่า"
                      value={fmtBaht(postData?.Price)}
                      right
                    />
                    <Row
                      label="ค่ามัดจำ"
                      value={fmtBaht(postData?.Deposit_Rent)}
                      right
                    />
                  </>
                ) : (
                  <>
                    <Row
                      label="ราคาขาย"
                      value={fmtBaht(postData?.Price)}
                      right
                    />
                    <Row
                      label="เงินดาวน์"
                      value={fmtBaht(postData?.Deposit_Amount)}
                      right
                    />
                    <Row
                      label="ดอกเบี้ยโดยประมาณ"
                      value={
                        postData?.Interest || postData?.Interest === 0
                          ? `${Number(postData.Interest)}% / ปี`
                          : "-"
                      }
                      right
                    />
                  </>
                )}
                <Row
                  label="ค่าใช้จ่ายอื่น ๆ"
                  value={postData?.Other_related_expenses || "-"}
                />
              </div>
            </Section>

            {/* ผู้ขาย */}
            <Section
              title="ข้อมูลผู้ขาย"
              onEdit={() => navigate("/seller/post-for-sale/inform")}
            >
              <div className="space-y-1">
                <Row label="ชื่อผู้ขาย" value={postData?.Name || "-"} />
                <Row label="เบอร์โทร" value={postData?.Phone || "-"} />
                <Row
                  label="LINE"
                  value={
                    postData?.Link_line ? (
                      <a
                        href={postData.Link_line}
                        target="_blank"
                        rel="noreferrer"
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
                    postData?.Link_facbook ? (
                      <a
                        href={postData.Link_facbook}
                        target="_blank"
                        rel="noreferrer"
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
            <Section
              title="รูปภาพประกาศ"
              onEdit={() => navigate("/seller/post-for-sale/upload")}
            >
              {hasImages ? (
                <div className="grid grid-cols-3 gap-3">
                  {images.map((img, idx) => {
                    const url =
                      img?.secure_url ||
                      img?.url ||
                      (typeof img === "string" ? img : "");
                    return (
                      <div
                        key={idx}
                        className="relative w-full aspect-square rounded-lg overflow-hidden ring-1 ring-black/5"
                      >
                        {url ? (
                          <img
                            src={url}
                            alt={`property-${idx}`}
                            className="w-full h-full object-cover"
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
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-muted-foreground flex items-center gap-2">
                  <ImageIcon className="w-4 h-4" /> ไม่มีรูปภาพ
                </div>
              )}
            </Section>

            {/* ปุ่มยืนยัน */}
            <div className="flex justify-between pt-2">
              <Button
                variant="outline"
                onClick={() => navigate("/seller/post-for-sale/upload")}
              >
                ย้อนกลับ
              </Button>
              <Button
                onClick={() => setShowConfirm(true)}
                className="min-w-[140px]"
              >
                ยืนยันการโพสต์
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal ยืนยัน */}
      <AlertDialog open={showConfirm} onOpenChange={setShowConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการโพสต์ประกาศ</AlertDialogTitle>
          </AlertDialogHeader>
          <p className="text-sm text-muted-foreground">
            คุณแน่ใจหรือไม่ว่าต้องการโพสต์ประกาศนี้?
            หลังจากโพสต์แล้วคุณยังสามารถแก้ไขได้ภายหลัง
          </p>
          <AlertDialogFooter>
            <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
            <AlertDialogAction onClick={handleSubmit}>
              โพสต์ประกาศ
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </PostLayout>
  );
};

export default PostConfirm;
