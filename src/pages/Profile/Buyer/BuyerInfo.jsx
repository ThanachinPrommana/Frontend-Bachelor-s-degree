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

// map enum → label
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

/* ========== helper: ห่อ diff ให้เป็น nested payload ========== */
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

function toNestedPayload(diff) {
  const payload = {};
  for (const [k, v] of Object.entries(diff)) {
    if (BUYER_KEYS.includes(k)) {
      payload.Buyer = payload.Buyer || {};
      payload.Buyer[k] = v;
    } else {
      // user-level (First_name, Last_name, Phone, image)
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
                      onClick={() =>
                        navigator.clipboard?.writeText(String(user?.Email))
                      }
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
                  const payload = toNestedPayload(diff);

                  // ✅ แก้เงื่อนไข: เช็กแค่ว่ามี key อะไรจะอัปเดตไหม (รองรับแก้เฉพาะชื่อ/นามสกุล)
                  if (!Object.keys(payload).length) {
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
