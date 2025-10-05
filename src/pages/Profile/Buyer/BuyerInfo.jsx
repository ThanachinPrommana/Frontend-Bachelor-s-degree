// src/pages/Profile/Buyer/BuyerInfo.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Pencil, Copy, Image as ImageIcon, FileText } from "lucide-react";
import { useMemo, useState } from "react";
import Formuploadimage from "@/components/form/Formuploadimage";
import { updateProfile } from "@/api/user"; // ✅ ใช้ตัวเดียวให้คงที่
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

// cache-busting helper
const withBust = (url, bust) =>
  url ? `${url}${url.includes("?") ? "&" : "?"}cb=${bust}` : url;

// make relative path absolute
const absolutize = (maybeUrl) => {
  if (!maybeUrl) return null;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  const base = import.meta.env.VITE_API_URL || window.location.origin;
  return `${base.replace(/\/$/, "")}/${String(maybeUrl).replace(/^\//, "")}`;
};

// map enum → label (ตาม Prisma)
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

/* ====== allow-lists & coercers (ให้ตรง Prisma/Backend) ====== */
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

// ฟิลด์ระดับ User ที่อนุญาตให้อัปเดต (ไม่รวม Email)
const USER_ALLOWED = ["First_name", "Last_name", "Phone", "image"];

const PARKING_ENUM = new Set(["oneCar", "twoCars", "Not_required"]);
const NEARBY_ENUM = new Set([
  "BTS_MRT",
  "School",
  "Hospital",
  "Mall_Market",
  "Park_Nature",
]);
const LIFESTYLE_ENUM = new Set([
  "Work_from_Home",
  "Have_Pets",
  "Need_a_Home_Office",
  "Like_Gardening",
]);

const toFloatOrNull = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const toIntOrNull = (v) => {
  if (v === "" || v === undefined || v === null) return null;
  const n = Number(v);
  return Number.isInteger(n) ? n : Number.isFinite(n) ? Math.trunc(n) : null;
};
const toISODateOrNull = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d) ? null : d.toISOString();
};
const emptyToNull = (v) => (v === "" ? null : v);

/** sanitize diff ให้เหลือแต่คีย์ที่อนุญาต + แปลงชนิดให้ตรง Prisma */
function sanitizeDiff(diff) {
  const out = {};
  for (const [k, raw] of Object.entries(diff || {})) {
    // เฉพาะคีย์ที่อนุญาตเท่านั้น
    if (!BUYER_KEYS.includes(k) && !USER_ALLOWED.includes(k)) continue;

    // ฝั่ง Buyer → แปลงชนิด/ตรวจ enum
    if (BUYER_KEYS.includes(k)) {
      switch (k) {
        case "Monthly_Income":
          out[k] = toFloatOrNull(raw);
          break;
        case "Family_Size":
          out[k] = toIntOrNull(raw);
          break;
        case "DateofBirth":
          out[k] = toISODateOrNull(raw);
          break;
        case "Parking_Needs":
          out[k] = PARKING_ENUM.has(raw) ? raw : null;
          break;
        case "Nearby_Facilities":
          out[k] = NEARBY_ENUM.has(raw) ? raw : null;
          break;
        case "Lifestyle_Preferences":
          out[k] = LIFESTYLE_ENUM.has(raw) ? raw : null;
          break;
        case "Occupation":
        case "Preferred_Province":
        case "Preferred_District":
        case "Preferred_Subdistrict":
        case "Special_Requirements":
          out[k] = emptyToNull(raw);
          break;
        default:
          out[k] = raw;
      }
      continue;
    }

    // ฝั่ง User (First_name, Last_name, Phone, image)
    if (USER_ALLOWED.includes(k)) {
      if (k === "image") {
        out[k] = raw ? absolutize(raw) : null;
      } else {
        out[k] = emptyToNull(raw);
      }
    }
  }
  return out;
}

/** ห่อ diff ที่ sanitize แล้วให้เป็น nested payload (User + Buyer) */
function toNestedPayload(sanitized) {
  const payload = {};
  for (const [k, v] of Object.entries(sanitized)) {
    if (BUYER_KEYS.includes(k)) {
      payload.Buyer = payload.Buyer || {};
      payload.Buyer[k] = v;
    } else if (USER_ALLOWED.includes(k)) {
      payload[k] = v;
    }
  }
  return payload;
}

/* ========== main ========== */
const BuyerInfo = () => {
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { authUser: user, revalidateUser } = useAuth();

  const [avatarBust, setAvatarBust] = useState(0);
  const [localAvatar, setLocalAvatar] = useState(null);

  // ข้อมูลแสดงในโปรไฟล์
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
                className="cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-blue-300"
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
                className="cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-blue-300"
              >
                <Pencil className="w-4 h-4 mr-2" />
                แก้ไขข้อมูล
              </Button>
            </div>
          </div>

          {/* โมดัลอัปโหลดรูป */}
          {showImageModal && (
            <ModalShell
              title="อัปโหลดรูปโปรไฟล์"
              description="รองรับไฟล์ JPG/PNG ขนาดแนะนำ 400×400px (ไม่เกิน ~5MB)"
              icon={<ImageIcon className="w-5 h-5" />}
              onClose={() => {
                setShowImageModal(false);
                setLocalAvatar(null);
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
                  <div>เคล็ดลับ: ใช้รูปสว่าง ชัดเจน เห็นใบหน้า</div>
                </div>
              </div>

              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 mb-4 bg-gray-50">
                <Formuploadimage
                  onUploadSuccess={async (payloadOrUrl) => {
                    try {
                      const payload =
                        typeof payloadOrUrl === "string"
                          ? { url: payloadOrUrl }
                          : payloadOrUrl || {};
                      if (payload.preview) setLocalAvatar(payload.preview);
                      if (payload.url) {
                        const abs = absolutize(payload.url);
                        try {
                          await updateProfile({ image: abs }); // ✅ ใช้ตัวเดียวให้ตรง
                        } catch (e) {
                          console.warn(
                            "updateProfile(image) failed, continue:",
                            e
                          );
                        }
                      }
                      await revalidateUser();
                      setAvatarBust(Date.now());
                      setLocalAvatar(null);
                      setShowImageModal(false);
                    } catch (err) {
                      console.error("รูปภาพอัปเดตล้มเหลว:", err);
                      alert("ไม่สามารถบันทึกรูปได้");
                    }
                  }}
                />
              </div>

              <div className="text-xs text-gray-500">
                * การเปลี่ยนรูปจะมีผลทันทีหลังบันทึก
              </div>
            </ModalShell>
          )}

          {/* โมดัลแก้ไขข้อมูล */}
          {showModal && (
            <ModalShell
              title="แก้ไขข้อมูลผู้ซื้อ"
              description="ใส่ข้อมูลทีละส่วน • บัญชีผู้ใช้ → ผู้ซื้อ • อีเมลถูกล็อกไว้เพื่อความปลอดภัย"
              icon={<FileText className="w-5 h-5" />}
              onClose={() => setShowModal(false)}
            >
              <BuyerEditForm
                user={user}
                onCancel={() => setShowModal(false)}
                onSubmitDiff={async (diff) => {
                  // 1) กรอง/แปลงค่าให้ตรง Prisma/Backend
                  const sanitized = sanitizeDiff(diff);
                  // 2) ห่อเป็น payload ซ้อน (User + Buyer)
                  const payload = toNestedPayload(sanitized);

                  // ✅ เช็กว่าไม่มีอะไรจะอัปเดตก็ไม่ยิง
                  if (!Object.keys(payload).length && !payload.Buyer) {
                    alert("ไม่มีการแก้ไขข้อมูล");
                    return;
                  }

                  try {
                    await updateProfile(payload);
                    await revalidateUser();
                    setShowModal(false);
                  } catch (err) {
                    console.error("Error update user:", err);
                    alert(err?.response?.data?.message || "Server Error");
                  }
                }}
              />
            </ModalShell>
          )}

          {/* รายละเอียด */}
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
