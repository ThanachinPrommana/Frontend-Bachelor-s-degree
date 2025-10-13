// src/pages/Profile/Buyer/BuyerInfo.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Copy,
  Image as ImageIcon,
  FileText,
  Loader2,
} from "lucide-react";
import { useMemo, useState } from "react";
import Formuploadimage from "@/components/form/Formuploadimage";
import { updateProfile, updateImage } from "@/api/user"; // ✅ เพิ่ม updateImage
import { useAuth } from "@/context/AuthContext";
import ModalShell from "@/components/profile/ModalShell";
import BuyerEditForm from "@/components/profile/buyer/BuyerEditForm";
import DetailRow from "@/components/profile/DetailRow";

/* ========== utils ========== */
const formatDateThai = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date)) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatBaht = (n) => {
  if (n === null || n === undefined || n === "") return "-";
  const num = Number(n);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
};

const withBust = (url, bust) =>
  url ? `${url}${url.includes("?") ? "&" : "?"}cb=${bust}` : url;

const absolutize = (maybeUrl) => {
  if (!maybeUrl) return null;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  const base = import.meta.env.VITE_API_URL || window.location.origin;
  return `${base.replace(/\/$/, "")}/${String(maybeUrl).replace(/^\//, "")}`;
};

const parkingLabel = (v) =>
  ({
    oneCar: "ที่จอด 1 คัน",
    twoCars: "ที่จอด 2 คัน",
    Not_required: "ไม่ต้องการ",
  }[v] || "-");

const nearbyLabel = (v) =>
  ({
    BTS_MRT: "BTS/MRT",
    School: "โรงเรียน",
    Hospital: "โรงพยาบาล",
    Mall_Market: "ห้าง/ตลาด",
    Park_Nature: "สวนสาธารณะ",
  }[v] || "-");

const lifestyleLabel = (v) =>
  ({
    Work_from_Home: "ทำงานที่บ้าน",
    Have_Pets: "เลี้ยงสัตว์",
    Need_a_Home_Office: "ต้องการห้องทำงาน",
    Like_Gardening: "ชอบทำสวน",
  }[v] || "-");

/* ========== sanitize diff ========== */
const BUYER_KEYS = [
  "DateofBirth",
  "Occupation",
  "Monthly_Income",
  "Family_Size",
  "Preferred_Province",
  "Preferred_District",
  "Preferred_Subdistrict",
  "Parking_Needs",
  "Nearby_Facilities",
  "Lifestyle_Preferences",
  "Special_Requirements",
];
const USER_ALLOWED = ["First_name", "Last_name", "Phone", "image"];

const sanitizeDiff = (diff) => {
  const payload = {};
  const buyerPart = {};

  Object.entries(diff || {}).forEach(([key, value]) => {
    if (USER_ALLOWED.includes(key)) payload[key] = value || null;
    if (BUYER_KEYS.includes(key)) buyerPart[key] = value || null;
  });

  if (Object.keys(buyerPart).length > 0) payload.Buyer = buyerPart;
  return payload;
};

/* ========== main ========== */
const BuyerInfo = () => {
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { authUser: user, revalidateUser } = useAuth();
  const [avatarBust, setAvatarBust] = useState(0);
  const [localAvatar, setLocalAvatar] = useState(null);
  const [saving, setSaving] = useState(false); // สำหรับปุ่ม "แก้ไขข้อมูล"
  const [uploading, setUploading] = useState(false); // สำหรับอัปโหลดรูป

  /* ===== แสดงรายละเอียด ===== */
  const detailRows = useMemo(() => {
    const b = user?.Buyer || {};
    return [
      { label: "เบอร์โทร", value: user?.Phone || "-" },
      { label: "วันเกิด", value: formatDateThai(b?.DateofBirth) },
      { label: "อาชีพ", value: b?.Occupation || "-" },
      { label: "รายได้", value: formatBaht(b?.Monthly_Income) },
      { label: "ขนาดครอบครัว", value: b?.Family_Size ?? "-" },
      { label: "จังหวัดที่สนใจ", value: b?.Preferred_Province || "-" },
      { label: "เขตที่สนใจ", value: b?.Preferred_District || "-" },
      { label: "ตำบล/แขวง", value: b?.Preferred_Subdistrict || "-" },
      { label: "ที่จอดรถ", value: parkingLabel(b?.Parking_Needs) },
      { label: "สิ่งอำนวยความสะดวก", value: nearbyLabel(b?.Nearby_Facilities) },
      { label: "ไลฟ์สไตล์", value: lifestyleLabel(b?.Lifestyle_Preferences) },
      { label: "ความต้องการพิเศษ", value: b?.Special_Requirements || "-" },
    ];
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">โปรไฟล์ผู้ซื้อ</h2>
      <Card className="shadow-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  key={localAvatar ? "local" : avatarBust}
                  src={
                    localAvatar ||
                    withBust(absolutize(user?.image), avatarBust) ||
                    "https://via.placeholder.com/80"
                  }
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border ring-2 ring-[#2c3e50]/20"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Buyer";
                  }}
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 inline-flex h-5 items-center justify-center rounded-full bg-white px-2 text-[10px] font-semibold text-[#2c3e50] shadow">
                  Buyer
                </span>
              </div>
              <div>
                <p className="text-xl font-bold">
                  {user?.First_name} {user?.Last_name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">{user?.Email || "-"}</p>
                  {!!user?.Email && (
                    <button
                      type="button"
                      title="คัดลอกอีเมล"
                      onClick={() => {
                        try {
                          navigator.clipboard?.writeText(String(user?.Email));
                        } catch {}
                      }}
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ปุ่มแก้ไข */}
            <div className="flex justify-center items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setLocalAvatar(null);
                  setShowImageModal(true);
                }}
              >
                แก้ไขรูป
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowModal(true)}
                disabled={saving}
              >
                {saving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  <>
                    <Pencil className="w-4 h-4 mr-2" />
                    แก้ไขข้อมูล
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Modal Upload Image */}
          {showImageModal && (
            <ModalShell
              title="อัปโหลดรูปโปรไฟล์"
              description="รองรับไฟล์ JPG/PNG ≤5MB"
              icon={<ImageIcon className="w-5 h-5" />}
              onClose={() => {
                if (!uploading) {
                  setShowImageModal(false);
                  setLocalAvatar(null);
                }
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  key={`modal-${localAvatar ? "local" : avatarBust}`}
                  src={
                    localAvatar ||
                    withBust(absolutize(user?.image), avatarBust) ||
                    "https://via.placeholder.com/80"
                  }
                  className="w-16 h-16 rounded-full object-cover border"
                  alt="current avatar"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Buyer";
                  }}
                />
                <div className="text-xs text-gray-500">
                  <div>รูปปัจจุบัน / พรีวิวใหม่</div>
                  <div>เคล็ดลับ: ใช้รูปสว่าง เห็นใบหน้า</div>
                </div>
              </div>

              {/* ✅ ใช้ updateImage() แทน updateProfile */}
              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 mb-4 bg-gray-50">
                <Formuploadimage
                  onUploadSuccess={async (formData) => {
                    try {
                      setUploading(true);
                      await updateImage(formData); // ✅ เปลี่ยนตรงนี้
                      await revalidateUser();
                      setAvatarBust(Date.now());
                      setLocalAvatar(null);
                      setShowImageModal(false);
                    } catch (err) {
                      console.error("อัปโหลดรูปไม่สำเร็จ:", err);
                      alert("ไม่สามารถบันทึกรูปได้");
                    } finally {
                      setUploading(false);
                    }
                  }}
                />
              </div>

              <div className="text-xs text-gray-500">
                * รูปจะอัปเดตทันทีหลังบันทึก
              </div>
            </ModalShell>
          )}

          {/* Modal แก้ไขข้อมูล */}
          {showModal && (
            <ModalShell
              title="แก้ไขข้อมูลผู้ซื้อ"
              description="กรอกข้อมูลผู้ซื้อเพื่อปรับปรุงโปรไฟล์"
              icon={<FileText className="w-5 h-5" />}
              onClose={() => setShowModal(false)}
            >
              <BuyerEditForm
                user={user}
                onCancel={() => setShowModal(false)}
                onSubmitDiff={async (diff) => {
                  const payload = sanitizeDiff(diff);
                  if (!Object.keys(payload).length && !payload.Buyer) {
                    alert("ไม่มีการแก้ไขข้อมูล");
                    return;
                  }
                  try {
                    setSaving(true);
                    await updateProfile(payload);
                    await revalidateUser();
                    setShowModal(false);
                  } catch (err) {
                    console.error("updateProfile failed:", err);
                    alert(err?.response?.data?.message || "Server Error");
                  } finally {
                    setSaving(false);
                  }
                }}
              />
            </ModalShell>
          )}

          {/* รายละเอียดโปรไฟล์ */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
            {detailRows.map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerInfo;
