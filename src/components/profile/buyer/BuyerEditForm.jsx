// src/components/profile/buyer/BuyerEditForm.jsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ThaiLocationSelect from "@/components/profile/ThaiLocationSelect"; // ✅ ใช้คอมโพเนนต์ที่เรียก API

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

// yyyy-mm-dd สำหรับ input[type=date]
const toISODate = (v) => {
  if (!v) return "";
  const d = new Date(v);
  if (isNaN(d)) return "";
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${d.getFullYear()}-${mm}-${dd}`;
};

function buildDefaults(user) {
  const b = user?.Buyer || {};
  return {
    First_name: user?.First_name ?? "",
    Last_name: user?.Last_name ?? "",
    Phone: user?.Phone ?? "",
    Buyer: {
      DateofBirth: toISODate(b?.DateofBirth) ?? "",
      Occupation: b?.Occupation ?? "",
      Monthly_Income:
        typeof b?.Monthly_Income === "number" ? String(b.Monthly_Income) : "",
      Family_Size:
        typeof b?.Family_Size === "number" ? String(b.Family_Size) : "",
      Preferred_Province: b?.Preferred_Province ?? "",
      Preferred_District: b?.Preferred_District ?? "",
      Preferred_Subdistrict: b?.Preferred_Subdistrict ?? "",
      Parking_Needs: b?.Parking_Needs ?? "",
      Nearby_Facilities: b?.Nearby_Facilities ?? "",
      Lifestyle_Preferences: b?.Lifestyle_Preferences ?? "",
      Special_Requirements: b?.Special_Requirements ?? "",
    },
  };
}

function makeDiff(values, user) {
  const diff = {};
  // user-level
  if ((values.First_name ?? "") !== (user?.First_name ?? ""))
    diff.First_name = values.First_name;
  if ((values.Last_name ?? "") !== (user?.Last_name ?? ""))
    diff.Last_name = values.Last_name;
  if ((values.Phone ?? "") !== (user?.Phone ?? "")) diff.Phone = values.Phone;

  // buyer-level
  const bOld = user?.Buyer || {};
  const bCur = values.Buyer || {};
  const putBuyer = (k, v) => {
    if (!diff.Buyer) diff.Buyer = {};
    // string ว่าง -> null, แปลงตัวเลข
    if (v === "") v = null;
    if (k === "Monthly_Income" || k === "Family_Size") {
      if (v !== null) {
        const n = Number(v);
        v = Number.isNaN(n) ? null : n;
      }
    }
    if (k === "DateofBirth" && v) v = new Date(v);
    diff.Buyer[k] = v;
  };

  BUYER_KEYS.forEach((k) => {
    const cur = bCur[k] ?? "";
    const old =
      k === "DateofBirth"
        ? toISODate(bOld[k])
        : k === "Monthly_Income" || k === "Family_Size"
        ? typeof bOld[k] === "number"
          ? String(bOld[k])
          : ""
        : bOld[k] ?? "";
    if ((cur ?? "") !== (old ?? "")) putBuyer(k, cur);
  });

  if (diff.Buyer && Object.keys(diff.Buyer).length === 0) delete diff.Buyer;
  return diff;
}

export default function BuyerEditForm({ user, onCancel, onSubmitDiff }) {
  const defaults = useMemo(() => buildDefaults(user), [user]);

  const {
    register,
    handleSubmit,
    formState: { isDirty },
    reset,
    setValue,
    watch,
  } = useForm({
    defaultValues: defaults,
    mode: "onChange",
    shouldUnregister: false, // ✅ เก็บค่าแม้ซ่อนหน้า
  });

  useEffect(() => {
    reset(buildDefaults(user));
  }, [user, reset]);

  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false); // ✅ state โหลดสั้นๆ

  // ผูก watch เพื่อส่งค่าให้ ThaiLocationSelect
  const buyerVals = watch("Buyer");

  const f = {
    First_name: register("First_name"),
    Last_name: register("Last_name"),
    Phone: register("Phone"),
    Buyer: {
      DateofBirth: register("Buyer.DateofBirth"),
      Occupation: register("Buyer.Occupation"),
      Monthly_Income: register("Buyer.Monthly_Income"),
      Family_Size: register("Buyer.Family_Size"),
      // 3 ฟิลด์ location จะ setValue ผ่าน ThaiLocationSelect
      Parking_Needs: register("Buyer.Parking_Needs"),
      Nearby_Facilities: register("Buyer.Nearby_Facilities"),
      Lifestyle_Preferences: register("Buyer.Lifestyle_Preferences"),
      Special_Requirements: register("Buyer.Special_Requirements"),
    },
  };

  const onSubmit = (vals) => {
    setLoading(true);
    const diff = makeDiff(vals, user);
    // ดีเลย์สั้นๆ ให้มีฟีลลิ่งกำลังบันทึก
    setTimeout(() => {
      onSubmitDiff?.(diff);
      setLoading(false);
    }, 300);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Header tabs (display only) */}
      <div className="flex items-center gap-3">
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            step === 1 ? "bg-slate-900 text-white" : "bg-slate-100"
          }`}
        >
          1 บัญชีผู้ใช้
        </span>
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            step === 2 ? "bg-slate-900 text-white" : "bg-slate-100"
          }`}
        >
          2 ผู้ซื้อ
        </span>
      </div>

      {/* ---------- หน้า 1: บัญชีผู้ใช้ ---------- */}
      <div className={step === 1 ? "" : "hidden"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              อีเมล (ล็อกไว้)
            </label>
            <input
              value={user?.Email ?? ""}
              disabled
              className="w-full rounded border px-3 py-2 bg-gray-100 text-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ชื่อจริง (First Name)
            </label>
            <input
              {...f.First_name}
              className="w-full rounded border px-3 py-2"
              placeholder="เช่น Somchai"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              นามสกุล (Last Name)
            </label>
            <input
              {...f.Last_name}
              className="w-full rounded border px-3 py-2"
              placeholder="เช่น Jaidee"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">เบอร์โทร</label>
            <input
              {...f.Phone}
              className="w-full rounded border px-3 py-2"
              placeholder="เช่น 0812345678"
            />
          </div>

          <div className="sm:col-span-2 flex justify-between mt-2">
            {/* ยกเลิก: สีแดง (อยู่ซ้าย) */}
            <Button variant="destructive" type="button" onClick={onCancel}>
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
              onClick={() => setStep(2)}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- หน้า 2: ผู้ซื้อ ---------- */}
      <div className={step === 2 ? "" : "hidden"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">วันเกิด</label>
            <input
              type="date"
              {...f.Buyer.DateofBirth}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">อาชีพ</label>
            <input
              {...f.Buyer.Occupation}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              รายได้ต่อเดือน (บาท)
            </label>
            <input
              type="number"
              inputMode="numeric"
              {...f.Buyer.Monthly_Income}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              จำนวนสมาชิกครอบครัว (คน)
            </label>
            <input
              type="number"
              inputMode="numeric"
              {...f.Buyer.Family_Size}
              className="w-full rounded border px-3 py-2"
            />
          </div>

          {/* ✅ ใช้ ThaiLocationSelect ที่ดึงข้อมูลจาก API (จังหวัด/อำเภอ/ตำบล) */}
          <ThaiLocationSelect
            provinceValue={buyerVals?.Preferred_Province || ""}
            districtValue={buyerVals?.Preferred_District || ""}
            subDistrictValue={buyerVals?.Preferred_Subdistrict || ""}
            showSubDistrict
            onProvinceChange={(v) => {
              setValue("Buyer.Preferred_Province", v, { shouldDirty: true });
              setValue("Buyer.Preferred_District", "", { shouldDirty: true });
              setValue("Buyer.Preferred_Subdistrict", "", {
                shouldDirty: true,
              });
            }}
            onDistrictChange={(v) => {
              setValue("Buyer.Preferred_District", v, { shouldDirty: true });
              setValue("Buyer.Preferred_Subdistrict", "", {
                shouldDirty: true,
              });
            }}
            onSubDistrictChange={(v) =>
              setValue("Buyer.Preferred_Subdistrict", v, { shouldDirty: true })
            }
          />

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ความต้องการที่จอดรถ
            </label>
            <select
              {...f.Buyer.Parking_Needs}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">-</option>
              <option value="oneCar">1 คัน</option>
              <option value="twoCars">2 คัน</option>
              <option value="Not_required">ไม่ต้องการ</option>
            </select>
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              สิ่งอำนวยความสะดวกใกล้เคียง
            </label>
            <select
              {...f.Buyer.Nearby_Facilities}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">-</option>
              <option value="BTS_MRT">BTS/MRT</option>
              <option value="School">โรงเรียน</option>
              <option value="Hospital">โรงพยาบาล</option>
              <option value="Mall_Market">ห้าง/ตลาด</option>
              <option value="Park_Nature">สวนสาธารณะ</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              รูปแบบการใช้ชีวิต
            </label>
            <select
              {...f.Buyer.Lifestyle_Preferences}
              className="w-full rounded border px-3 py-2"
            >
              <option value="">-</option>
              <option value="Work_from_Home">ทำงานที่บ้าน</option>
              <option value="Have_Pets">เลี้ยงสัตว์</option>
              <option value="Need_a_Home_Office">ต้องการห้องทำงาน</option>
              <option value="Like_Gardening">ชอบทำสวน</option>
            </select>
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              ความต้องการพิเศษ (ถ้ามี)
            </label>
            <textarea
              {...f.Buyer.Special_Requirements}
              className="w-full rounded border px-3 py-2"
              rows={3}
              placeholder="เช่น ต้องการที่เงียบ ใกล้รถไฟฟ้า"
            />
          </div>

          {/* ✅ สลับตำแหน่งปุ่ม + สี */}
          <div className="sm:col-span-2 flex justify-between mt-2">
            {/* ยกเลิก (แดง) อยู่ซ้ายสุด */}
            <Button type="button" variant="destructive" onClick={onCancel}>
              ยกเลิก
            </Button>

            <div className="flex gap-2">
              {/* ย้อนกลับ (เทา) */}
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
              >
                ย้อนกลับ
              </Button>

              {/* บันทึกเป็นปุ่มหลัก + แสดงโหลดสั้นๆ */}
              <Button
                type="submit"
                className="bg-[#2C3E50] hover:bg-[#1a252f] text-white flex items-center gap-2"
                disabled={!isDirty || loading}
              >
                {loading && <Loader2 className="h-4 w-4 animate-spin" />}
                {loading ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
