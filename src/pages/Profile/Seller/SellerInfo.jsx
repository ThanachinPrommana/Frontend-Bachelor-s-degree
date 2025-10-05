// src/pages/Profile/Seller/SellerInfo.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  Copy,
  Image as ImageIcon,
  FileText,
  XCircle,
  CheckCircle2,
  Clock3,
} from "lucide-react";
import React, { useMemo, useState, useCallback } from "react";
import Formuploadimage from "@/components/form/Formuploadimage";
import { updateSeller } from "@/api/user";
import { useAuth } from "@/context/AuthContext";
import ModalShell from "@/components/profile/ModalShell";
import SellerEditForm from "@/components/profile/seller/SellerEditForm";
import DetailRow from "@/components/profile/DetailRow";

/* ========== utils (safe) ========== */
const formatDateThai = (dateString) => {
  if (!dateString) return "-";
  const d = new Date(dateString);
  if (Number.isNaN(d.getTime())) return "-";
  return d.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

const formatBaht = (n) => {
  if (n === null || n === undefined || n === "") return "-";
  const num = Number(n);
  if (!Number.isFinite(num)) return "-";
  return num.toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
};

const maskThaiID = (id) => {
  if (!id) return "-";
  const s = String(id).replace(/\D/g, "");
  if (s.length !== 13) return "-";
  return `${s[0]}-xxxx-xxxxx-xx-${s[12]}`;
};

// protocol guard
const isSafeHttpUrl = (u) => {
  try {
    const x = new URL(u, window.location.origin);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
};

// cache-busting + absolutize (http/https only)
const withBust = (url, bust) =>
  url ? `${url}${url.includes("?") ? "&" : "?"}cb=${bust}` : url;

const absolutize = (maybeUrl) => {
  if (!maybeUrl) return null;
  const s = String(maybeUrl).trim();
  if (!s) return null;

  if (isSafeHttpUrl(s)) return s; // already absolute + safe
  // treat as server-relative path
  const base = (import.meta.env.VITE_API_URL || window.location.origin).replace(
    /\/$/,
    ""
  );
  const path = s.replace(/^\//, "");
  const abs = `${base}/${path}`;
  return isSafeHttpUrl(abs) ? abs : null;
};

// enum → label
const parkingLabel = (v) =>
  ({ oneCar: "1 คัน", twoCars: "2 คัน", Not_required: "ไม่ต้องการ" }[v] || "-");

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

/* ========== status chip ========== */
const StatusBadge = ({ status }) => {
  const s = (status || "").toUpperCase();
  if (s === "APPROVED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-500 text-white px-3 py-1 text-xs font-semibold">
        <CheckCircle2 className="w-3.5 h-3.5" /> ยืนยันแล้ว
      </span>
    );
  if (s === "REJECTED")
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-600 text-white px-3 py-1 text-xs font-semibold">
        <XCircle className="w-3.5 h-3.5" /> ถูกปฏิเสธ
      </span>
    );
  return (
    <span className="inline-flex items-center gap-1 rounded-full bg-yellow-500 text-white px-3 py-1 text-xs font-semibold">
      <Clock3 className="w-3.5 h-3.5" /> รอดำเนินการ
    </span>
  );
};

/* ========== security: whitelist fields before PATCH ========== */
const deepPick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

// ✅ รูปโปรไฟล์เก็บใน User เท่านั้น
const USER_ALLOWED = [
  "First_name",
  "Last_name",
  "Email",
  "Phone",
  "image",
  "publicId",
];
const BUYER_ALLOWED = [
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
const SELLER_ALLOWED = [
  "National_ID",
  "Company_Name",
  "RealEstate_License",
  "nationalIdImage",
  // ไม่อนุญาตแก้ Seller.publicId
];

const sanitizeNestedDiff = (nested) => {
  const safe = {};
  if (nested?.user) safe.user = deepPick(nested.user, USER_ALLOWED);
  if (nested?.buyer) safe.buyer = deepPick(nested.buyer, BUYER_ALLOWED);
  if (nested?.seller) safe.seller = deepPick(nested.seller, SELLER_ALLOWED);
  return safe;
};

// helper ว่างจริง ๆ
const isEmptyObject = (o) => !o || Object.keys(o).length === 0;

/* ========== main ========== */
export default function SellerInfo() {
  const { authUser: user, revalidateUser } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [avatarBust, setAvatarBust] = useState(0);
  const [localAvatar, setLocalAvatar] = useState(null);

  const detailRows = useMemo(() => {
    const b = user?.Buyer || {};
    const s = user?.Seller || {};
    return [
      { label: "เบอร์โทร", value: user?.Phone || "-" },
      { label: "วันเกิด", value: formatDateThai(b?.DateofBirth) },
      { label: "อาชีพ", value: b?.Occupation || "-" },
      { label: "รายได้ต่อเดือน", value: formatBaht(b?.Monthly_Income) },
      {
        label: "ขนาดครอบครัว",
        value: Number.isFinite(b?.Family_Size) ? b.Family_Size : "-",
      },
      { label: "จังหวัดที่สนใจ", value: b?.Preferred_Province || "-" },
      { label: "ตำบล/แขวง", value: b?.Preferred_Subdistrict || "-" },
      { label: "เขต/อำเภอที่สนใจ", value: b?.Preferred_District || "-" },
      { label: "ที่จอดรถ", value: parkingLabel(b?.Parking_Needs) },
      { label: "สิ่งอำนวยความสะดวก", value: nearbyLabel(b?.Nearby_Facilities) },
      { label: "ไลฟ์สไตล์", value: lifestyleLabel(b?.Lifestyle_Preferences) },
      { label: "ความต้องการพิเศษ", value: b?.Special_Requirements || "-" },
      // — ชุดล่าง —
      { label: "เลขบัตรประชาชน", value: maskThaiID(s?.National_ID) },
      { label: "บริษัท", value: s?.Company_Name || "-" },
      { label: "ใบอนุญาตนายหน้า", value: s?.RealEstate_License || "-" },
      { label: "สถานะบัญชี", value: <StatusBadge status={s?.Status} /> },
    ];
  }, [user]);

  const copyEmail = useCallback(async () => {
    const text = String(user?.Email || "");
    if (!text) return;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(text);
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        ta.setAttribute("readonly", "");
        ta.style.position = "absolute";
        ta.style.left = "-9999px";
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        document.body.removeChild(ta);
      }
    } catch {
      // เงียบ ๆ
    }
  }, [user?.Email]);

  const avatarSrc = useMemo(() => {
    const base = localAvatar || withBust(absolutize(user?.image), avatarBust);
    return base || "https://via.placeholder.com/80";
  }, [localAvatar, user?.image, avatarBust]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">โปรไฟล์ผู้ขาย</h2>

      <Card className="shadow-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  key={localAvatar ? "local" : avatarBust}
                  src={avatarSrc}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border ring-2 ring-[#2c3e50]/20"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Seller";
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading="eager"
                  draggable={false}
                />
                <span className="absolute -bottom-1 -right-1 inline-flex h-5 items-center justify-center rounded-full bg-white px-2 text-[10px] font-semibold text-[#2c3e50] shadow">
                  Seller
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
                      aria-label="คัดลอกอีเมล"
                      title="คัดลอกอีเมล"
                      onClick={copyEmail}
                      className="p-1 rounded hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-300"
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

          {/* รายละเอียด */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
            {detailRows.slice(0, 12).map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value} />
            ))}

            {/* เส้นคั่น */}
            <div className="col-span-1 sm:col-span-2 my-2">
              <div className="h-px bg-gray-200" />
            </div>

            {detailRows.slice(12).map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value} />
            ))}
          </div>

          {/* โมดัลอัปโหลดรูป */}
          {showImageModal && (
            <ModalShell
              title="อัปโหลดรูปโปรไฟล์"
              description="รองรับไฟล์รูปภาพทั่วไป (แนะนำ ≥ 400×400px)"
              icon={<ImageIcon className="w-5 h-5" />}
              onClose={() => {
                setShowImageModal(false);
                setLocalAvatar(null);
              }}
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  key={`modal-${localAvatar ? "local" : avatarBust}`}
                  src={avatarSrc}
                  className="w-16 h-16 rounded-full object-cover border"
                  alt="current avatar"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Seller";
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  draggable={false}
                  loading="lazy"
                  decoding="async"
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

                      await revalidateUser();
                      setAvatarBust(Date.now()); // bust cache
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
              title="แก้ไขข้อมูลผู้ขาย"
              description="แก้ไขข้อมูลทีละส่วน • บัญชีผู้ใช้ → ผู้ซื้อ → ผู้ขาย"
              icon={<FileText className="w-5 h-5" />}
              onClose={() => setShowModal(false)}
            >
              <SellerEditForm
                user={user}
                onCancel={() => setShowModal(false)}
                onSubmitDiff={async (nestedDiff) => {
                  const safeDiff = sanitizeNestedDiff(nestedDiff);

                  const noUser = isEmptyObject(safeDiff.user);
                  const noBuyer = isEmptyObject(safeDiff.buyer);
                  const noSeller = isEmptyObject(safeDiff.seller);
                  if (noUser && noBuyer && noSeller) {
                    alert("ไม่มีการแก้ไขข้อมูล");
                    return;
                  }

                  try {
                    await updateSeller(safeDiff);
                    await revalidateUser();
                    setShowModal(false);
                  } catch (err) {
                    console.error("updateSeller failed:", err);
                    alert(err?.response?.data?.message || "Server Error");
                  }
                }}
              />
            </ModalShell>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
