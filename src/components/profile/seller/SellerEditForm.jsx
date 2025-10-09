import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ThaiLocationSelect from "@/components/profile/ThaiLocationSelect";

/* ====== ฟิลด์ ====== */
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
const SELLER_KEYS = ["National_ID", "Company_Name", "RealEstate_License"];

/* yyyy-mm-dd สำหรับ input[type=date] */
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
  const s = user?.Seller || {};
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
    Seller: {
      National_ID: s?.National_ID ?? "",
      Company_Name: s?.Company_Name ?? "",
      RealEstate_License: s?.RealEstate_License ?? "",
    },
  };
}

/* ====== สร้าง diff แบบ nested พร้อมกัน: User + Buyer + Seller ====== */
function makeDiff(values, user) {
  const diff = {};

  // --- User-level (ห้ามส่งค่าว่าง -> null ให้คอลัมน์ที่บังคับ) ---
  const putUser = (k, cur, old) => {
    if ((cur ?? "") === (old ?? "")) return;
    if (cur === "") return; // ถ้าล้างช่องของ field บังคับ -> ไม่ส่ง
    diff[k] = cur;
  };
  putUser("First_name", values.First_name, user?.First_name);
  putUser("Last_name", values.Last_name, user?.Last_name);
  putUser("Phone", values.Phone, user?.Phone);

  // --- Buyer-level (optional ยอมรับ null) ---
  const bOld = user?.Buyer || {};
  const bCur = values.Buyer || {};
  const putBuyer = (k, v) => {
    if (!diff.buyer) diff.buyer = {};
    if (v === "") v = null;
    if (k === "Monthly_Income" || k === "Family_Size") {
      if (v !== null) {
        const n = Number(v);
        v = Number.isNaN(n) ? null : n;
      }
    }
    if (k === "DateofBirth" && v) v = new Date(v);
    diff.buyer[k] = v;
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
  if (diff.buyer && Object.keys(diff.buyer).length === 0) delete diff.buyer;

  // --- Seller-level ---
  const sOld = user?.Seller || {};
  const sCur = values.Seller || {};
  const putSeller = (k, v) => {
    if (!diff.seller) diff.seller = {};
    if (k === "National_ID") {
      if (v === "") return; // field บังคับ ล้างช่อง -> ไม่ส่ง
      const onlyDigit = String(v).replace(/\D/g, "");
      if (onlyDigit.length !== 13) {
        throw new Error("เลขบัตรประชาชนต้องมี 13 หลัก");
      }
      diff.seller[k] = onlyDigit;
      return;
    }
    if (v === "") v = null;
    diff.seller[k] = v;
  };
  SELLER_KEYS.forEach((k) => {
    const cur = sCur[k] ?? "";
    const old = sOld[k] ?? "";
    if ((cur ?? "") !== (old ?? "")) putSeller(k, cur);
  });
  if (diff.seller && Object.keys(diff.seller).length === 0) delete diff.seller;

  return diff;
}

export default function SellerEditForm({ user, onCancel, onSubmitDiff }) {
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
    shouldUnregister: false,
  });

  useEffect(() => {
    reset(buildDefaults(user));
  }, [user, reset]);

  const [step, setStep] = useState(1); // 1: User, 2: Buyer, 3: Seller
  const [loading, setLoading] = useState(false);

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
      Parking_Needs: register("Buyer.Parking_Needs"),
      Nearby_Facilities: register("Buyer.Nearby_Facilities"),
      Lifestyle_Preferences: register("Buyer.Lifestyle_Preferences"),
      Special_Requirements: register("Buyer.Special_Requirements"),
    },
    Seller: {
      National_ID: register("Seller.National_ID"),
      Company_Name: register("Seller.Company_Name"),
      RealEstate_License: register("Seller.RealEstate_License"),
    },
  };

  const onSubmit = async (vals) => {
    try {
      setLoading(true);
      const diff = makeDiff(vals, user);

      // ✅ รอ parent ทำงานจริง (update -> revalidate -> close)
      await onSubmitDiff?.(diff);

      // (ถ้าต้องการ reset dirty state หลังสำเร็จ)
      // reset(buildDefaults({ ...user, ...อาจใช้ user ใหม่จาก context }));
    } catch (e) {
      alert(e.message || "กรุณาตรวจสอบข้อมูลอีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6" noValidate>
      {/* Tabs */}
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
        <span
          className={`px-3 py-1 rounded-full text-sm ${
            step === 3 ? "bg-slate-900 text-white" : "bg-slate-100"
          }`}
        >
          3 ผู้ขาย
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">เบอร์โทร</label>
            <input
              {...f.Phone}
              className="w-full rounded border px-3 py-2"
              placeholder="เช่น 0812345678"
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2 flex justify-between mt-2">
            <Button
              variant="destructive"
              type="button"
              onClick={onCancel}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
              onClick={() => setStep(2)}
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">อาชีพ</label>
            <input
              {...f.Buyer.Occupation}
              className="w-full rounded border px-3 py-2"
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <ThaiLocationSelect
            provinceValue={buyerVals?.Preferred_Province || ""}
            districtValue={buyerVals?.Preferred_District || ""}
            subDistrictValue={buyerVals?.Preferred_Subdistrict || ""}
            showSubDistrict
            disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
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
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2 flex justify-between mt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={onCancel}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={loading}
              >
                ย้อนกลับ
              </Button>
              <Button
                type="button"
                className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
                onClick={() => setStep(3)}
                disabled={loading}
              >
                ถัดไป
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* ---------- หน้า 3: ผู้ขาย ---------- */}
      <div className={step === 3 ? "" : "hidden"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              เลขบัตรประชาชน
            </label>
            <input
              {...f.Seller.National_ID}
              className="w-full rounded border px-3 py-2"
              placeholder="13 หลัก"
              disabled={loading}
              onChange={(e) => {
                e.target.value = e.target.value.replace(/\D/g, "").slice(0, 13);
              }}
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ชื่อบริษัท
            </label>
            <input
              {...f.Seller.Company_Name}
              className="w-full rounded border px-3 py-2"
              placeholder="เช่น บริษัท สมาร์ทโฮม จำกัด"
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">
              เลขที่ใบอนุญาตนายหน้า
            </label>
            <input
              {...f.Seller.RealEstate_License}
              className="w-full rounded border px-3 py-2"
              placeholder="เช่น 62-xxxxxxxx"
              disabled={loading}
            />
          </div>

          <div className="sm:col-span-2 flex justify-between mt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={onCancel}
              disabled={loading}
            >
              ยกเลิก
            </Button>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(2)}
                disabled={loading}
              >
                ย้อนกลับ
              </Button>
              <Button
                type="submit"
                className="bg-[#2C3E50] hover:bg-[#1a252f] text-white flex items-center gap-2"
                disabled={!isDirty || loading}
                aria-busy={loading}
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
