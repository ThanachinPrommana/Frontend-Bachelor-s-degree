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
import React, { useMemo, useState, useCallback } from "react";
import Formuploadimage from "@/components/form/Formuploadimage";
import { updateProfile, updateImage } from "@/api/user";
import { useAuth } from "@/context/AuthContext";
import ModalShell from "@/components/profile/ModalShell";
import BuyerEditForm from "@/components/profile/buyer/BuyerEditForm";
import DetailRow from "@/components/profile/DetailRow";

/* ========== Metro provinces whitelist (กทม + ปริมณฑล) ========== */
const METRO_PROVINCES = [
  "กรุงเทพมหานคร",
  "นนทบุรี",
  "ปทุมธานี",
  "สมุทรปราการ",
  "สมุทรสาคร",
  "นครปฐม",
];
const isMetroProvince = (name) =>
  METRO_PROVINCES.includes(String(name || "").trim());

/* ========== utils (safe & แบบเดียวกับ Seller) ========== */
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

const isSafeHttpUrl = (u) => {
  try {
    const x = new URL(u, window.location.origin);
    return x.protocol === "http:" || x.protocol === "https:";
  } catch {
    return false;
  }
};

const withBust = (url, bust) =>
  url ? `${url}${url.includes("?") ? "&" : "?"}cb=${bust}` : url;

const absolutize = (maybeUrl) => {
  if (!maybeUrl) return null;
  const s = String(maybeUrl).trim();
  if (!s) return null;

  if (isSafeHttpUrl(s)) return s; // absolute & safe แล้ว
  const base = (import.meta.env.VITE_API_URL || window.location.origin).replace(
    /\/$/,
    ""
  );
  const path = s.replace(/^\//, "");
  const abs = `${base}/${path}`;
  return isSafeHttpUrl(abs) ? abs : null;
};

const parkingLabel = (v) =>
  ({
    oneCar: "1 คัน",
    twoCars: "2 คัน",
    threePlus: "3 คันขึ้นไป",
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

/* ========== security: whitelist fields ก่อน PATCH (สไตล์เดียวกับ Seller) ========== */
const deepPick = (obj, keys) =>
  Object.fromEntries(
    Object.entries(obj || {}).filter(([k]) => keys.includes(k))
  );

const USER_ALLOWED = [
  "First_name",
  "Last_name",
  "Email",
  "Phone",
  "image",
  "publicId",
];
const BUYER_ALLOWED = [
  "DateofBirth", // แม้ไม่โชว์ แต่ whitelist ไว้
  "Occupation", // แม้ไม่โชว์ แต่ whitelist ไว้
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

const isEmptyObject = (o) => !o || Object.keys(o).length === 0;

/* ===== sanitize รองรับทั้ง {user,buyer} และรูปแบบ flat {First_name,..., Buyer} ===== */
const sanitizeNestedDiff = (nested) => {
  const safe = {};
  const top = nested || {};

  // รวม user จากทั้ง top-level และ top.user
  const userTop = deepPick(top, USER_ALLOWED);
  const userObj = top.user ? deepPick(top.user, USER_ALLOWED) : {};
  const userMerged = { ...userObj, ...userTop };
  if (!isEmptyObject(userMerged)) safe.user = userMerged;

  // รองรับ buyer แบบ nested (buyer) หรือ (Buyer)
  const buyerSrc = top.buyer ?? top.Buyer ?? null;
  if (buyerSrc) {
    const picked = deepPick(buyerSrc, BUYER_ALLOWED);
    if (!isEmptyObject(picked)) safe.buyer = picked;
  }

  return safe;
};

/* ========== main ========== */
const BuyerInfo = () => {
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { authUser: user, revalidateUser } = useAuth();
  const [avatarBust, setAvatarBust] = useState(0);
  const [localAvatar, setLocalAvatar] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

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
    } catch {}
  }, [user?.Email]);

  /* ===== แสดงรายละเอียด =====
   * ตัด “วันเกิด” และ “อาชีพ”
   * จังหวัดที่สนใจ: แสดงเฉพาะ กทม/ปริมณฑล มิฉะนั้น "-"
   */
  const detailRows = useMemo(() => {
    const b = user?.Buyer || {};
    const provinceDisplay = isMetroProvince(b?.Preferred_Province)
      ? b.Preferred_Province
      : "-";

    return [
      { label: "เบอร์โทร", value: user?.Phone || "-" },
      { label: "รายได้ต่อเดือน", value: formatBaht(b?.Monthly_Income) },
      {
        label: "ขนาดครอบครัว",
        value: Number.isFinite(b?.Family_Size) ? b.Family_Size : "-",
      },
      { label: "จังหวัดที่สนใจ", value: provinceDisplay },
      { label: "ตำบล/แขวง", value: b?.Preferred_Subdistrict || "-" },
      { label: "เขต/อำเภอที่สนใจ", value: b?.Preferred_District || "-" },
      { label: "ที่จอดรถ", value: parkingLabel(b?.Parking_Needs) },
      { label: "สิ่งอำนวยความสะดวก", value: nearbyLabel(b?.Nearby_Facilities) },
      { label: "ไลฟ์สไตล์", value: lifestyleLabel(b?.Lifestyle_Preferences) },
      { label: "ความต้องการพิเศษ", value: b?.Special_Requirements || "-" },
    ];
  }, [user]);

  const avatarSrc = useMemo(() => {
    const base = localAvatar || withBust(absolutize(user?.image), avatarBust);
    return base || "https://via.placeholder.com/80";
  }, [localAvatar, user?.image, avatarBust]);

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
                  src={avatarSrc}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border ring-2 ring-[#2c3e50]/20"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Buyer";
                  }}
                  referrerPolicy="no-referrer"
                  crossOrigin="anonymous"
                  loading="eager"
                  draggable={false}
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
                className="cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-blue-300"
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

          {/* โมดัลอัปโหลดรูป */}
          {showImageModal && (
            <ModalShell
              title="อัปโหลดรูปโปรไฟล์"
              description="รองรับไฟล์รูปภาพทั่วไป (แนะนำ ≥ 400×400px)"
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
                  src={avatarSrc}
                  className="w-16 h-16 rounded-full object-cover border"
                  alt="current avatar"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Buyer";
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
                  onUploadSuccess={async (data) => {
                    try {
                      setUploading(true);
                      const formData = data?.formData ?? data;
                      if (data?.preview) setLocalAvatar(data.preview);

                      await updateImage(formData);
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

          {/* โมดัลแก้ไขข้อมูล */}
          {showModal && (
            <ModalShell
              title="แก้ไขข้อมูลผู้ซื้อ"
              description="แก้ไขเฉพาะข้อมูลที่จำเป็น"
              icon={<FileText className="w-5 h-5" />}
              onClose={() => setShowModal(false)}
            >
              <BuyerEditForm
                user={user}
                onCancel={() => setShowModal(false)}
                onSubmitDiff={async (nestedDiff) => {
                  // ✅ ทำงานเหมือนฝั่ง Seller: รับ diff แบบ nested แล้ว sanitize + wrap
                  const safeDiff = sanitizeNestedDiff(nestedDiff);

                  const noUser = isEmptyObject(safeDiff.user);
                  const noBuyer = isEmptyObject(safeDiff.buyer);
                  if (noUser && noBuyer) {
                    alert("ไม่มีการแก้ไขข้อมูล");
                    return;
                  }

                  const payload = {
                    ...(safeDiff.user || {}),
                    ...(safeDiff.buyer ? { Buyer: safeDiff.buyer } : {}),
                  };

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
