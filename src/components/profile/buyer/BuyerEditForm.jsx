// src/components/profile/buyer/BuyerEditForm.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";
import ThaiLocationSelect from "@/components/profile/ThaiLocationSelect";

/* ====== ปริมณฑล (whitelist) ====== */
const METRO_PROVINCES = [
  "กรุงเทพมหานคร",
  "นนทบุรี",
  "ปทุมธานี",
  "สมุทรปราการ",
  "สมุทรสาคร",
  "นครปฐม",
];
const isMetro = (name) => METRO_PROVINCES.includes(String(name || "").trim());

/* ====== ตัวเลือกที่จอดรถ (เพิ่ม threePlus) ====== */
const ALLOWED_PARKING = ["oneCar", "twoCars", "threePlus", "Not_required"];

/* ====== ฟิลด์ผู้ซื้อ (ตัด DateofBirth, Occupation ออก) ====== */
const BUYER_KEYS = [
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

/* ====== defaults: province ต้องอยู่ในปริมณฑลเท่านั้น ====== */
function buildDefaults(user) {
  const b = user?.Buyer || {};
  const province = isMetro(b?.Preferred_Province) ? b.Preferred_Province : "";

  return {
    First_name: user?.First_name ?? "",
    Last_name: user?.Last_name ?? "",
    Phone: user?.Phone ?? "",
    Buyer: {
      Monthly_Income:
        typeof b?.Monthly_Income === "number" ? String(b.Monthly_Income) : "",
      Family_Size:
        typeof b?.Family_Size === "number" ? String(b.Family_Size) : "",
      Preferred_Province: province,
      Preferred_District: province ? b?.Preferred_District ?? "" : "",
      Preferred_Subdistrict: province ? b?.Preferred_Subdistrict ?? "" : "",
      Parking_Needs: ALLOWED_PARKING.includes(b?.Parking_Needs)
        ? b.Parking_Needs
        : "",
      Nearby_Facilities: b?.Nearby_Facilities ?? "",
      Lifestyle_Preferences: b?.Lifestyle_Preferences ?? "",
      Special_Requirements: b?.Special_Requirements ?? "",
    },
  };
}

/* ====== diff: ส่งแบบ nested เป็น diff.buyer (เหมือน Seller), บังคับ metro/ตัวเลข/clear เขต-แขวง ====== */
function makeDiff(values, user) {
  const diff = {};

  // --- User-level ---
  const putUser = (k, cur, old) => {
    if ((cur ?? "") === (old ?? "")) return;
    if (cur === "") return; // ป้องกันล้าง field บังคับโดยไม่ตั้งใจ
    diff[k] = cur;
  };
  putUser("First_name", values.First_name, user?.First_name);
  putUser("Last_name", values.Last_name, user?.Last_name);
  putUser("Phone", values.Phone, user?.Phone);

  // --- Buyer-level ---
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

    // กันจังหวัดนอกปริมณฑล
    if (k === "Preferred_Province" && v && !isMetro(v)) v = null;

    // ถ้า province ว่าง/นอกลิสต์ → district/subdistrict = null เสมอ
    if (
      (k === "Preferred_District" || k === "Preferred_Subdistrict") &&
      !isMetro(bCur?.Preferred_Province)
    ) {
      v = null;
    }

    // กันค่าที่จอดรถนอกลิสต์
    if (k === "Parking_Needs" && v !== null) {
      v = ALLOWED_PARKING.includes(v) ? v : null;
    }

    diff.buyer[k] = v;
  };

  BUYER_KEYS.forEach((k) => {
    const cur = bCur[k] ?? "";
    const old =
      k === "Monthly_Income" || k === "Family_Size"
        ? typeof bOld[k] === "number"
          ? String(bOld[k])
          : ""
        : bOld[k] ?? "";
    if ((cur ?? "") !== (old ?? "")) putBuyer(k, cur);
  });

  if (diff.buyer && Object.keys(diff.buyer).length === 0) delete diff.buyer;

  return diff;
}

/* ====== number-format helpers (รายได้ต่อเดือน) ====== */
const nfTH = new Intl.NumberFormat("th-TH");
const sanitizeDigits = (s) => String(s ?? "").replace(/\D/g, "");
const formatGrouping = (digits) => (digits ? nfTH.format(Number(digits)) : "");
function digitsRightCount(str, cursor) {
  let cnt = 0;
  for (let i = cursor; i < str.length; i++) if (/\d/.test(str[i])) cnt++;
  return cnt;
}
function caretFromDigitsRight(str, digitsRight) {
  for (let i = str.length; i >= 0; i--) {
    if (digitsRightCount(str, i) === digitsRight) return i;
  }
  return str.length;
}

/* ====== Component ====== */
export default function BuyerEditForm({ user, onCancel, onSubmitDiff }) {
  const defaults = useMemo(() => buildDefaults(user), [user]);

  const {
    register,
    handleSubmit,
    formState: { isDirty, isSubmitting },
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

  const [step, setStep] = useState(1); // 1: User, 2: Buyer
  const buyerVals = watch("Buyer");

  // ====== สถานะ/อีเวนต์สำหรับ "รายได้ต่อเดือน" ที่แสดงคอมม่า ======
  const incomeRef = useRef(null);
  const [incomeDisplay, setIncomeDisplay] = useState("");

  // sync UI เมื่อค่าฟอร์มเปลี่ยนจากภายนอก
  useEffect(() => {
    const digits = sanitizeDigits(buyerVals?.Monthly_Income ?? "");
    setIncomeDisplay(formatGrouping(digits));
  }, [buyerVals?.Monthly_Income]);

  // onChange พร้อมรักษา caret
  const handleIncomeChange = (e) => {
    const raw = e.target.value;
    const prevPos = incomeRef.current?.selectionStart ?? raw.length;
    const rightDigits = digitsRightCount(raw, prevPos);

    const digits = sanitizeDigits(raw); // เก็บในฟอร์มเป็น digits ล้วน
    setValue("Buyer.Monthly_Income", digits, { shouldDirty: true });

    const display = formatGrouping(digits); // แสดงมีคอมม่า
    setIncomeDisplay(display);

    requestAnimationFrame(() => {
      const el = incomeRef.current;
      if (!el) return;
      const newPos = caretFromDigitsRight(display, rightDigits);
      el.setSelectionRange(newPos, newPos);
    });
  };

  const f = {
    First_name: register("First_name"),
    Last_name: register("Last_name"),
    Phone: register("Phone"),
    Buyer: {
      Monthly_Income: register("Buyer.Monthly_Income"),
      Family_Size: register("Buyer.Family_Size"),
      Parking_Needs: register("Buyer.Parking_Needs"),
      Nearby_Facilities: register("Buyer.Nearby_Facilities"),
      Lifestyle_Preferences: register("Buyer.Lifestyle_Preferences"),
      Special_Requirements: register("Buyer.Special_Requirements"),
    },
  };

  const onSubmit = handleSubmit(async (vals) => {
    const diff = makeDiff(vals, user);

    const noBuyer = !diff.buyer || Object.keys(diff.buyer).length === 0;
    const noUser = !diff.First_name && !diff.Last_name && !diff.Phone;
    if (noBuyer && noUser) {
      alert("ไม่มีการแก้ไขข้อมูล");
      return;
    }

    await onSubmitDiff?.(diff);
    // parent จะ revalidate user ให้ -> reset ตาม user ล่าสุด
    reset(buildDefaults(user));
  });

  return (
    <form
      onSubmit={onSubmit}
      className="space-y-6"
      noValidate
      aria-busy={isSubmitting}
    >
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="block text-sm text-gray-600 mb-1">เบอร์โทร</label>
            <input
              {...f.Phone}
              className="w-full rounded border px-3 py-2"
              placeholder="เช่น 0812345678"
              disabled={isSubmitting}
            />
          </div>

          <div className="sm:col-span-2 flex justify-between mt-2">
            <Button
              variant="destructive"
              type="button"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>
            <Button
              type="button"
              className="bg-[#2C3E50] hover:bg-[#1a252f] text-white"
              onClick={() => setStep(2)}
              disabled={isSubmitting}
            >
              ถัดไป
            </Button>
          </div>
        </div>
      </div>

      {/* ---------- หน้า 2: ผู้ซื้อ (ไม่มีวันเกิด/อาชีพ) ---------- */}
      <div className={step === 2 ? "" : "hidden"}>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* ✅ รายได้ต่อเดือน: คั่นหลักพันอัตโนมัติ */}
          <div>
            <label className="block text-sm text-gray-600 mb-1">
              รายได้ต่อเดือน (บาท)
            </label>
            <input
              ref={incomeRef}
              type="text"
              inputMode="numeric"
              value={incomeDisplay}
              onChange={handleIncomeChange}
              className="w-full rounded border px-3 py-2"
              placeholder="เช่น 50,000"
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          {/* จำกัดจังหวัดเฉพาะ กทม+ปริมณฑล */}
          <ThaiLocationSelect
            provinceWhitelist={METRO_PROVINCES}
            provinceValue={buyerVals?.Preferred_Province || ""}
            districtValue={buyerVals?.Preferred_District || ""}
            subDistrictValue={buyerVals?.Preferred_Subdistrict || ""}
            showSubDistrict
            disabled={isSubmitting}
            onProvinceChange={(v) => {
              const next = isMetro(v) ? v : "";
              setValue("Buyer.Preferred_Province", next, { shouldDirty: true });
              setValue("Buyer.Preferred_District", "", { shouldDirty: true });
              setValue("Buyer.Preferred_Subdistrict", "", {
                shouldDirty: true,
              });
            }}
            onDistrictChange={(v) => {
              if (!isMetro(buyerVals?.Preferred_Province)) return;
              setValue("Buyer.Preferred_District", v, { shouldDirty: true });
              setValue("Buyer.Preferred_Subdistrict", "", {
                shouldDirty: true,
              });
            }}
            onSubDistrictChange={(v) => {
              if (!isMetro(buyerVals?.Preferred_Province)) return;
              setValue("Buyer.Preferred_Subdistrict", v, { shouldDirty: true });
            }}
          />

          <div>
            <label className="block text-sm text-gray-600 mb-1">
              ความต้องการที่จอดรถ
            </label>
            <select
              {...f.Buyer.Parking_Needs}
              className="w-full rounded border px-3 py-2"
              disabled={isSubmitting}
            >
              <option value="">-</option>
              <option value="oneCar">1 คัน</option>
              <option value="twoCars">2 คัน</option>
              <option value="threePlus">3 คันขึ้นไป</option>
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
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
              disabled={isSubmitting}
            />
          </div>

          {/* Action buttons */}
          <div className="sm:col-span-2 flex justify-between mt-2">
            <Button
              type="button"
              variant="destructive"
              onClick={onCancel}
              disabled={isSubmitting}
            >
              ยกเลิก
            </Button>

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                ย้อนกลับ
              </Button>

              <Button
                type="submit"
                className="bg-[#2C3E50] hover:bg-[#1a252f] text-white flex items-center gap-2"
                disabled={!isDirty || isSubmitting}
              >
                {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isSubmitting ? "กำลังบันทึก..." : "บันทึกทั้งหมด"}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
