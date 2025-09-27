// src/pages/Profile/Buyer/BuyerInfo.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  CircleX,
  Loader2,
  Copy,
  Image as ImageIcon,
  FileText,
  LockKeyhole,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import Frominput from "@/components/form/Frominput";
import Formuploadimage from "@/components/form/Formuploadimage";
import { useForm } from "react-hook-form";
import { updateprofile } from "@/api/user";
import { useAuth } from "@/context/AuthContext";

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
const toNum = (v) =>
  v === "" || v === null || v === undefined ? undefined : Number(v);

// cache-busting helper (เหมือนของ Seller)
const withBust = (url, bust) =>
  url ? `${url}${url.includes("?") ? "&" : "?"}cb=${bust}` : url;

// make relative path absolute (เหมือนของ Seller)
const absolutize = (maybeUrl) => {
  if (!maybeUrl) return null;
  if (/^https?:\/\//i.test(maybeUrl)) return maybeUrl;
  const base = import.meta.env.VITE_API_URL || window.location.origin;
  return `${base.replace(/\/$/, "")}/${String(maybeUrl).replace(/^\//, "")}`;
};

/* ========== small UI parts ========== */
const DetailRow = ({ label, value }) => {
  const isCopyable = !!value && value !== "-";
  return (
    <div className="group flex items-start justify-between gap-3 rounded-md p-2 hover:bg-gray-50 transition">
      <span className="text-[13px] text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">
          {value ?? "-"}
        </span>
        {isCopyable && (
          <button
            type="button"
            title="คัดลอก"
            onClick={() => navigator.clipboard?.writeText(String(value))}
            className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-200"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

/* ========== Modal shell: scrollable + fixed header ========== */
const ModalShell = ({
  title,
  description,
  icon,
  onClose,
  children,
  stepper,
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center overscroll-contain">
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      role="dialog"
      aria-modal="true"
      className="relative w-[95vw] sm:w-[90vw] max-w-3xl max-h-[90vh] bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col"
    >
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#2c3e50] via-[#3b4b63] to-[#2c3e50] text-white shrink-0">
        {icon}
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-semibold truncate">{title}</h3>
          {description ? (
            <p className="text-xs text-white/80">{description}</p>
          ) : null}
        </div>
        <button
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="p-1 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <CircleX className="w-5 h-5" />
        </button>
      </div>

      {stepper}

      <div className="p-6 overflow-y-auto min-w-0" data-modal-scroll-body>
        {children}
      </div>
    </div>
  </div>
);

/* ========== Thai locations hook ========== */
function useThaiLocations() {
  const [provinces, setProvinces] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        setLoadingProvinces(true);
        const res = await fetch(
          "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json"
        );
        const data = await res.json();
        setProvinces(data);
      } catch (e) {
        console.error("โหลดจังหวัดไม่สำเร็จ", e);
      } finally {
        setLoadingProvinces(false);
      }
    })();
  }, []);

  const loadDistrictsByProvinceNameTH = async (provinceNameTH) => {
    const target = provinces.find((p) => p.name_th === provinceNameTH);
    if (!target) {
      setDistricts([]);
      return;
    }
    try {
      setLoadingDistricts(true);
      const res = await fetch(
        "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json"
      );
      const amphures = await res.json();
      setDistricts(amphures.filter((d) => d.province_id === target.id));
    } catch (e) {
      console.error("โหลดอำเภอไม่สำเร็จ", e);
    } finally {
      setLoadingDistricts(false);
    }
  };

  return {
    provinces,
    districts,
    loadingProvinces,
    loadingDistricts,
    loadDistrictsByProvinceNameTH,
  };
}

/* ========== main ========== */
const BuyerInfo = () => {
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { authUser: user, revalidateUser } = useAuth();
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  // เหมือน Seller: รองรับพรีวิว + กันแคช
  const [avatarBust, setAvatarBust] = useState(0);
  const [localAvatar, setLocalAvatar] = useState(null);

  // two-step wizard: user -> buyer
  const [stepIndex, setStepIndex] = useState(0);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { isSubmitting, isDirty },
  } = useForm({ shouldUnregister: false });

  const {
    provinces,
    districts,
    loadingProvinces,
    loadingDistricts,
    loadDistrictsByProvinceNameTH,
  } = useThaiLocations();

  // default/reset values
  useEffect(() => {
    if (!user) return;
    reset({
      // USER
      First_name: user?.First_name || "",
      Last_name: user?.Last_name || "",
      Phone: user?.Phone || "",
      // BUYER
      DateofBirth: user?.Buyer?.DateofBirth
        ? String(user.Buyer.DateofBirth).slice(0, 10)
        : "",
      Occupation: user?.Buyer?.Occupation || user?.Buyer?.Occaaption || "",
      Monthly_Income: user?.Buyer?.Monthly_Income ?? "",
      Family_Size: user?.Buyer?.Family_Size ?? "",
      Preferred_Province: user?.Buyer?.Preferred_Province || "",
      Preferred_District: user?.Buyer?.Preferred_District || "",
      Parking_Needs: user?.Buyer?.Parking_Needs || "",
      Nearby_Facilities: user?.Buyer?.Nearby_Facilities || "",
      Lifestyle_Preferences: user?.Buyer?.Lifestyle_Preferences || "",
      Special_Requirements: user?.Buyer?.Special_Requirements || "",
    });
  }, [user, reset]);

  // open modal → reset to step 0 and prepare districts
  useEffect(() => {
    if (!showModal) return;
    setStepIndex(0);
    const province = user?.Buyer?.Preferred_Province;
    if (province) loadDistrictsByProvinceNameTH(province);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showModal]);

  // province change → load districts
  const handleProvinceChange = async (e) => {
    const val = e.target.value;
    setValue("Preferred_Province", val, { shouldDirty: true });
    setValue("Preferred_District", "", { shouldDirty: true });
    await loadDistrictsByProvinceNameTH(val);
  };

  // outside details
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
    ];
  }, [user]);

  /* ========== submit: send only diff ========== */
  const onSubmit = handleSubmit(async (values) => {
    setIsSubmittingInfo(true);
    try {
      const cleaned = Object.fromEntries(
        Object.entries(values).map(([k, v]) => [
          k,
          typeof v === "string" ? v.trim() : v,
        ])
      );
      if (cleaned.Monthly_Income !== undefined)
        cleaned.Monthly_Income = toNum(cleaned.Monthly_Income);
      if (cleaned.Family_Size !== undefined)
        cleaned.Family_Size = toNum(cleaned.Family_Size);

      const initial = {
        // USER
        First_name: user?.First_name || "",
        Last_name: user?.Last_name || "",
        Phone: user?.Phone || "",
        // BUYER
        DateofBirth: user?.Buyer?.DateofBirth
          ? String(user.Buyer.DateofBirth).slice(0, 10)
          : "",
        Occupation: user?.Buyer?.Occupation || user?.Buyer?.Occaaption || "",
        Monthly_Income: user?.Buyer?.Monthly_Income ?? "",
        Family_Size: user?.Buyer?.Family_Size ?? "",
        Preferred_Province: user?.Buyer?.Preferred_Province || "",
        Preferred_District: user?.Buyer?.Preferred_District || "",
        Parking_Needs: user?.Buyer?.Parking_Needs || "",
        Nearby_Facilities: user?.Buyer?.Nearby_Facilities || "",
        Lifestyle_Preferences: user?.Buyer?.Lifestyle_Preferences || "",
        Special_Requirements: user?.Buyer?.Special_Requirements || "",
      };

      const diff = Object.fromEntries(
        Object.entries(cleaned).filter(
          ([k, v]) => String(v ?? "") !== String(initial[k] ?? "")
        )
      );

      if (Object.keys(diff).length === 0) {
        alert("ไม่มีการแก้ไขข้อมูล");
        setIsSubmittingInfo(false);
        return;
      }

      await updateprofile(diff); // PATCH /profile (อัปเดต User + Buyer)
      await revalidateUser();
      setShowModal(false);
    } catch (err) {
      console.error("Error update user:", err);
      alert(err?.response?.data?.message || "Server Error");
    } finally {
      setIsSubmittingInfo(false);
    }
  });

  /* ========== steps ========== */
  const steps = [
    { key: "user", label: "บัญชีผู้ใช้" },
    { key: "buyer", label: "ผู้ซื้อ" },
  ];
  const isLastStep = stepIndex === steps.length - 1;

  const Stepper = (
    <div className="px-6 py-3 border-b bg-white/60 backdrop-blur-sm sticky top-0 z-10">
      <ol className="flex items-center gap-2 text-xs">
        {steps.map((s, idx) => {
          const active = idx === stepIndex;
          const done = idx < stepIndex;
          return (
            <li key={s.key} className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setStepIndex(idx)}
                className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border ${
                  active
                    ? "bg-[#2c3e50] text-white border-[#2c3e50]"
                    : done
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <span className="font-semibold">{idx + 1}</span>
                <span className="hidden sm:inline">{s.label}</span>
              </button>
              {idx !== steps.length - 1 && (
                <span className="text-gray-300">—</span>
              )}
            </li>
          );
        })}
      </ol>
    </div>
  );

  const StepUser = (
    <div>
      <h4 className="text-sm font-semibold text-gray-800 mb-1">ข้อมูลบัญชี</h4>
      <p className="text-xs text-gray-500">
        ชื่อ-นามสกุลและเบอร์โทรจะใช้แสดงในประกาศ • อีเมลถูกล็อกไว้
      </p>

      <div className="grid grid-cols-2 gap-4 mt-3">
        {/* Email (read-only) */}
        <div className="col-span-2">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            อีเมล (ล็อกไว้)
          </label>
          <div className="relative">
            <input
              type="email"
              value={user?.Email || ""}
              readOnly
              className="w-full rounded-md border bg-gray-100 cursor-not-allowed px-3 py-2 pr-9"
            />
            <LockKeyhole className="w-4 h-4 text-gray-500 absolute right-2 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        <Frominput
          label="ชื่อจริง (First Name)"
          name="First_name"
          placeholder="เช่น สมชาย"
          defaultValue={user?.First_name || ""}
          register={register}
        />
        <Frominput
          label="นามสกุล (Last Name)"
          name="Last_name"
          placeholder="เช่น ใจดี"
          defaultValue={user?.Last_name || ""}
          register={register}
        />
        <Frominput
          type="tel"
          label="เบอร์โทร"
          name="Phone"
          placeholder="เช่น 0812345678"
          defaultValue={user?.Phone || ""}
          register={register}
          onChange={(e) => {
            e.target.value = e.target.value.replace(/\D/g, "").slice(0, 10);
          }}
          registerOptions={{
            pattern: { value: /^\d{10}$/, message: "กรุณากรอกเบอร์ 10 หลัก" },
          }}
        />
      </div>
    </div>
  );

  const StepBuyer = (
    <div>
      <h4 className="text-sm font-semibold text-gray-800 mb-1">
        ข้อมูลผู้ซื้อ
      </h4>
      <p className="text-xs text-gray-500">
        ใช้สำหรับปรับแต่งคำแนะนำอสังหาฯ และแสดงบางส่วนในโปรไฟล์
      </p>

      <div className="grid grid-cols-2 gap-4 mt-3">
        <Frominput
          type="date"
          label="วันเกิด"
          name="DateofBirth"
          defaultValue={
            user?.Buyer?.DateofBirth
              ? String(user.Buyer.DateofBirth).slice(0, 10)
              : ""
          }
          register={register}
        />
        <Frominput
          label="อาชีพ"
          name="Occupation"
          placeholder="เช่น นักศึกษา / พนักงานบริษัท / ธุรกิจส่วนตัว"
          defaultValue={
            user?.Buyer?.Occupation || user?.Buyer?.Occaaption || ""
          }
          register={register}
        />
        <Frominput
          type="number"
          label="รายได้ต่อเดือน (บาท)"
          name="Monthly_Income"
          placeholder="เช่น 30000"
          defaultValue={user?.Buyer?.Monthly_Income ?? ""}
          register={register}
        />
        <Frominput
          type="number"
          label="จำนวนสมาชิกครอบครัว (คน)"
          name="Family_Size"
          placeholder="เช่น 3"
          defaultValue={user?.Buyer?.Family_Size ?? ""}
          register={register}
        />

        {/* จังหวัด */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            จังหวัดที่ต้องการ
          </label>
          <select
            {...register("Preferred_Province")}
            className="w-full border rounded-md p-2 disabled:bg-gray-100"
            onChange={handleProvinceChange}
            disabled={loadingProvinces}
            defaultValue={user?.Buyer?.Preferred_Province || ""}
          >
            <option value="">
              {loadingProvinces ? "กำลังโหลดจังหวัด..." : "เลือกจังหวัด"}
            </option>
            {provinces.map((province) => (
              <option key={province.id} value={province.name_th}>
                {province.name_th}
              </option>
            ))}
          </select>
        </div>

        {/* อำเภอ */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            อำเภอ/เขตที่ต้องการ
          </label>
          <select
            {...register("Preferred_District")}
            className="w-full border rounded-md p-2 disabled:bg-gray-100"
            disabled={loadingDistricts}
            defaultValue={user?.Buyer?.Preferred_District || ""}
          >
            <option value="">
              {loadingDistricts ? "กำลังโหลดอำเภอ..." : "เลือกอำเภอ/เขต"}
            </option>
            {districts.map((district) => (
              <option key={district.id} value={district.name_th}>
                {district.name_th}
              </option>
            ))}
          </select>
        </div>

        {/* Parking_Needs */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            ความต้องการที่จอดรถ
          </label>
          <select
            {...register("Parking_Needs")}
            className="w-full border rounded-md p-2"
            defaultValue={user?.Buyer?.Parking_Needs || ""}
          >
            <option value="">เลือกความต้องการที่จอดรถ</option>
            <option value="oneCar">1 คัน</option>
            <option value="twoCars">2 คัน</option>
            <option value="Not_required">ไม่ต้องการ</option>
          </select>
        </div>

        {/* Nearby_Facilities */}
        <div>
          <label className="block mb-1 text-sm font-medium text-gray-700">
            สิ่งอำนวยความสะดวกใกล้เคียง
          </label>
          <select
            {...register("Nearby_Facilities")}
            className="w-full border rounded-md p-2"
            defaultValue={user?.Buyer?.Nearby_Facilities || ""}
          >
            <option value="">เลือกสิ่งอำนวยความสะดวก</option>
            <option value="School">โรงเรียน</option>
            <option value="Hospital">โรงพยาบาล</option>
            <option value="Mall_Market">ห้าง/ตลาด</option>
            <option value="Park_Nature">สวนสาธารณะ</option>
          </select>
        </div>

        {/* Lifestyle_Preferences */}
        <div className="col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            รูปแบบการใช้ชีวิต
          </label>
          <select
            {...register("Lifestyle_Preferences")}
            className="w-full border rounded-md p-2"
            defaultValue={user?.Buyer?.Lifestyle_Preferences || ""}
          >
            <option value="">เลือกรูปแบบการใช้ชีวิต</option>
            <option value="Work_from_Home">ทำงานที่บ้าน</option>
            <option value="Have_Pets">เลี้ยงสัตว์</option>
            <option value="Need_a_Home_Office">ต้องการห้องทำงาน</option>
            <option value="Like_Gardening">ชอบทำสวน</option>
          </select>
        </div>

        {/* Special_Requirements */}
        <div className="col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            ความต้องการพิเศษ (ถ้ามี)
          </label>
          <textarea
            {...register("Special_Requirements")}
            placeholder="เช่น ต้องการที่เงียบสงบ ใกล้ถนนใหญ่"
            className="w-full border rounded-md p-2"
            rows="3"
            defaultValue={user?.Buyer?.Special_Requirements || ""}
          />
        </div>
      </div>
    </div>
  );

  const renderStep = () => (stepIndex === 0 ? StepUser : StepBuyer);

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
                  key={localAvatar ? "local" : avatarBust} // remount ให้โหลดใหม่เมื่อ bust เปลี่ยน
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
                  setLocalAvatar(null); // รีเซ็ตพรีวิวชั่วคราวทุกครั้งก่อนเปิด
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

          {/* โมดัลอัปโหลดรูป — ทำเหมือน Seller */}
          {showImageModal && (
            <ModalShell
              title="อัปโหลดรูปโปรไฟล์"
              description="รองรับไฟล์ JPG/PNG ขนาดแนะนำ 400×400px (ไม่เกิน ~5MB)"
              icon={<ImageIcon className="w-5 h-5" />}
              onClose={() => {
                setShowImageModal(false);
                setLocalAvatar(null); // ล้างพรีวิวเมื่อปิด
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
                      // รองรับทั้ง string URL แบบเก่า และ object { url, preview } แบบใหม่
                      const payload =
                        typeof payloadOrUrl === "string"
                          ? { url: payloadOrUrl }
                          : payloadOrUrl || {};

                      // 1) โชว์พรีวิวทันที
                      if (payload.preview) setLocalAvatar(payload.preview);

                      // 2) ถ้ามี URL → อัปเดต profile.image ไว้ก่อน (กันเคส backend ไม่ set ให้)
                      if (payload.url) {
                        const abs = absolutize(payload.url);
                        try {
                          await updateprofile({ image: abs });
                        } catch (e) {
                          console.warn(
                            "updateprofile(image) failed, continue:",
                            e
                          );
                        }
                      }

                      // 3) ดึง user ใหม่จาก server เสมอ
                      await revalidateUser();

                      // 4) กันแคช + ปิดโมดัล
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
                และอาจใช้เวลาสักครู่ในการรีเฟรชรูปใหม่
              </div>
            </ModalShell>
          )}

          {/* โมดัลแก้ไขข้อมูล (2 ขั้น) */}
          {showModal && (
            <ModalShell
              title="แก้ไขข้อมูลผู้ซื้อ"
              description="ใส่ข้อมูลทีละส่วน • บัญชีผู้ใช้ → ผู้ซื้อ • อีเมลถูกล็อกไว้เพื่อความปลอดภัย"
              icon={<FileText className="w-5 h-5" />}
              onClose={() => {
                if (
                  isDirty &&
                  !confirm("ยังไม่ได้บันทึกการแก้ไข ต้องการปิดหรือไม่?")
                )
                  return;
                setShowModal(false);
              }}
              stepper={Stepper}
            >
              <form onSubmit={onSubmit} className="space-y-6">
                {renderStep()}

                {/* footer */}
                <div className="sticky bottom-0 bg-white pt-3 px-6 -mx-6 border-t flex items-center justify-between">
                  <div className="text-xs text-gray-500">
                    ขั้นที่ {stepIndex + 1} / {steps.length}
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        if (stepIndex > 0) setStepIndex(stepIndex - 1);
                      }}
                      disabled={
                        stepIndex === 0 || isSubmittingInfo || isSubmitting
                      }
                    >
                      ย้อนกลับ
                    </Button>

                    {!isLastStep ? (
                      <Button
                        type="button"
                        className="bg-[#2C3E50] hover:bg-[#1a252f]"
                        onClick={() => setStepIndex(stepIndex + 1)}
                        disabled={isSubmittingInfo || isSubmitting}
                      >
                        ถัดไป
                      </Button>
                    ) : (
                      <Button
                        type="submit"
                        className="bg-[#2C3E50] hover:bg-[#1a252f]"
                        disabled={isSubmittingInfo || isSubmitting || !isDirty}
                      >
                        {isSubmittingInfo || isSubmitting ? (
                          <span className="inline-flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" />{" "}
                            กำลังบันทึก...
                          </span>
                        ) : (
                          "บันทึกทั้งหมด"
                        )}
                      </Button>
                    )}
                  </div>
                </div>
              </form>
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
