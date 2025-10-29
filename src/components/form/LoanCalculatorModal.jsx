import React, { useEffect, useRef, useState } from "react";
import { useAuth } from "@/context/AuthContext";

/* ========= ค่าคงที่สไตล์ธนาคาร (แบบง่าย) ========= */
const DSR = 0.4;
const LTV_FIRST = 0.9;
const LTV_NONFIRST = 0.8;
const RETIREMENT_AGE = 65;
const MAX_TERM_YEARS = 35;

/* ========= ประเภททรัพย์ (ให้ตรงกับระบบ) ========= */
const HOUSE_TYPES = [
  { value: "condo", label: "คอนโด" },
  { value: "house", label: "บ้านเดี่ยว" },
  { value: "villa", label: "วิลล่า" },
  { value: "townhouse", label: "ทาวน์เฮ้าส์" },
];

/* ========= utils ========= */
function thb(n) {
  if (!isFinite(n)) return "-";
  return new Intl.NumberFormat("th-TH", { maximumFractionDigits: 0 }).format(n);
}
function toNum(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
}
function pmt(loan, monthlyRate, n) {
  if (loan <= 0 || n <= 0) return 0;
  if (monthlyRate === 0) return loan / n;
  const r = monthlyRate;
  const a = Math.pow(1 + r, n);
  return (loan * r * a) / (a - 1);
}
function loanFromPayment(payment, monthlyRate, n) {
  if (payment <= 0 || n <= 0) return 0;
  if (monthlyRate === 0) return payment * n;
  const r = monthlyRate;
  const a = Math.pow(1 + r, n);
  return (payment * (a - 1)) / (r * a);
}

/* ========= UI ย่อย ========= */
function InfoLabel({ children, title }) {
  return (
    <span className="inline-flex items-center gap-1">
      {children}
      <span
        className="ml-1 inline-flex h-4 w-4 items-center justify-center rounded-full bg-gray-200 text-[10px] font-semibold text-gray-700 cursor-help"
        title={title}
        aria-label={title}
      >
        i
      </span>
    </span>
  );
}
function StatCard({ label, value, unit, highlight = false }) {
  return (
    <div
      className={
        "rounded-xl border p-4 shadow-sm " +
        (highlight ? "bg-blue-50 border-blue-200" : "bg-white")
      }
    >
      <div className="text-sm text-gray-600">{label}</div>
      <div className="mt-1 text-2xl md:text-3xl font-semibold tabular-nums">
        {value} <span className="text-base font-normal">{unit}</span>
      </div>
    </div>
  );
}

/* ========= ฟอร์มคำนวณ (โหมดง่าย) ========= */
function LoanCalculatorForm({ scrollRoot }) {
  const { user } = useAuth();

  // ดึงรายได้จากโปรไฟล์ (รองรับหลายรูปแบบ field เผื่อโค้ดฝั่ง Auth ต่างเวอร์ชัน)
  const profileIncome =
    toNum(
      user?.buyer?.Monthly_Income ??
        user?.Buyer?.Monthly_Income ??
        user?.Monthly_Income ??
        user?.profile?.Monthly_Income ??
        0
    ) || 0;

  const [formData, setFormData] = useState(() => ({
    houseType: "condo", // ค่าเริ่มต้นให้ตรงกับลิสต์
    firstHome: "yes",
    age: "30",
    netMonthlyIncome: String(profileIncome || 40000), // ถ้ามีในโปรไฟล์จะใช้เลย
    existingMonthlyDebt: "0",
    propertyPrice: "3000000",
    interestRate: "6.5",
    loanTermYears: "30",
  }));

  const [result, setResult] = useState(null);
  const [errors, setErrors] = useState({});

  // sync รายได้เมื่อ session/user ถูกเติมในภายหลัง (ไม่ทับค่าที่ผู้ใช้แก้เอง)
  useEffect(() => {
    if (profileIncome > 0) {
      setFormData((prev) =>
        prev.netMonthlyIncome === String(40000)
          ? { ...prev, netMonthlyIncome: String(profileIncome) }
          : prev
      );
    }
  }, [profileIncome]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const err = {};
    const age = toNum(formData.age);
    const income = toNum(formData.netMonthlyIncome);
    const debt = toNum(formData.existingMonthlyDebt);
    const price = toNum(formData.propertyPrice);
    const rate = toNum(formData.interestRate);
    const term = toNum(formData.loanTermYears);

    if (age < 18 || age > 70) err.age = "อายุต้องอยู่ระหว่าง 18–70 ปี";
    if (income <= 0) err.netMonthlyIncome = "กรอกรายได้สุทธิ (> 0)";
    if (debt < 0) err.existingMonthlyDebt = "หนี้รายเดือนไม่ควรติดลบ";
    if (price <= 0) err.propertyPrice = "กรอกราคาทรัพย์ (> 0)";
    if (rate < 0 || rate > 25)
      err.interestRate = "ดอกเบี้ยควรอยู่ระหว่าง 0–25%";
    if (term < 1 || term > MAX_TERM_YEARS)
      err.loanTermYears = `ระยะเวลากู้ 1–${MAX_TERM_YEARS} ปี`;
    return err;
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const err = validate();
    setErrors(err);
    if (Object.keys(err).length) {
      setResult(null);
      return;
    }

    const age = toNum(formData.age);
    const income = toNum(formData.netMonthlyIncome);
    const debt = toNum(formData.existingMonthlyDebt);
    const price = toNum(formData.propertyPrice);
    const annualRate = toNum(formData.interestRate) / 100;
    const termYearsInput = toNum(formData.loanTermYears);
    const firstHome = formData.firstHome === "yes";

    const termByAge = Math.max(
      1,
      Math.min(termYearsInput, RETIREMENT_AGE - age)
    );
    const termYears = Math.min(termByAge, MAX_TERM_YEARS);
    const n = Math.round(termYears * 12);
    const r = annualRate / 12;

    const affordablePayment = Math.max(0, income * DSR - debt);
    const loanByDSR = loanFromPayment(affordablePayment, r, n);
    const ltv = firstHome ? LTV_FIRST : LTV_NONFIRST;
    const loanByLTV = price * ltv;

    const finalLoan = Math.min(loanByDSR, loanByLTV);
    const monthlyPayment = pmt(finalLoan, r, n);
    const downPaymentNeeded = Math.max(0, price - finalLoan);

    setResult({
      termYears,
      affordablePayment,
      loanByDSR,
      loanByLTV,
      finalLoan,
      monthlyPayment,
      downPaymentNeeded,
      ltvPercent: ltv * 100,
    });

    // เลื่อนไปยังผลลัพธ์ "ภายในกล่องที่เลื่อนได้"
    setTimeout(() => {
      const target = (scrollRoot?.current || document).querySelector?.(
        "#loan-result"
      );
      if (target && scrollRoot?.current) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
      } else {
        document
          .getElementById("loan-result")
          ?.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }, 0);
  };

  return (
    <div>
      <h2 className="text-center text-2xl font-semibold mb-6">
        คำนวณวงเงินกู้บ้าน (โหมดอย่างง่าย)
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* House Type (ข้อมูลประกอบ) */}
        <div>
          <label className="block mb-1 font-medium">ประเภททรัพย์</label>
          <select
            name="houseType"
            value={formData.houseType}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            {HOUSE_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
          <p className="text-xs text-gray-500 mt-1">
            * ใช้เพื่อแสดงผล/อธิบายเท่านั้น (ยังไม่กระทบสูตรคำนวณ)
          </p>
        </div>

        {/* First Home */}
        <div>
          <label className="block mb-1 font-medium">
            <InfoLabel title="บ้านหลังแรก = เคยมีสินเชื่อบ้านมาก่อนหรือไม่ (มีผลต่อ LTV)">
              เป็นบ้านหลังแรก?
            </InfoLabel>
          </label>
          <select
            name="firstHome"
            value={formData.firstHome}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
          >
            <option value="yes">ใช่ (ใช้ LTV 90%)</option>
            <option value="no">ไม่ใช่ (ใช้ LTV 80%)</option>
          </select>
        </div>

        {/* Age */}
        <div>
          <label className="block mb-1 font-medium">อายุผู้กู้ (ปี)</label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            min="18"
            max="70"
          />
          {errors.age && (
            <p className="text-red-600 text-sm mt-1">{errors.age}</p>
          )}
        </div>

        {/* Net Monthly Income (prefill จากโปรไฟล์ถ้ามี) */}
        <div>
          <label className="block mb-1 font-medium">
            รายได้สุทธิต่อเดือน (บาท)
          </label>
          <input
            type="number"
            name="netMonthlyIncome"
            value={formData.netMonthlyIncome}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
            inputMode="numeric"
          />
          {errors.netMonthlyIncome && (
            <p className="text-red-600 text-sm mt-1">
              {errors.netMonthlyIncome}
            </p>
          )}
          {!profileIncome && (
            <p className="text-xs text-gray-500 mt-1">
              * ไม่พบรายได้ในโปรไฟล์ ระบบใช้ค่าเริ่มต้น 40,000 บาท (ปรับได้)
            </p>
          )}
        </div>

        {/* Existing Monthly Debt */}
        <div>
          <label className="block mb-1 font-medium">
            หนี้ผ่อนต่อเดือน (บาท)
          </label>
          <input
            type="number"
            name="existingMonthlyDebt"
            value={formData.existingMonthlyDebt}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
          />
          {errors.existingMonthlyDebt && (
            <p className="text-red-600 text-sm mt-1">
              {errors.existingMonthlyDebt}
            </p>
          )}
        </div>

        {/* Property Price */}
        <div>
          <label className="block mb-1 font-medium">ราคาทรัพย์ (บาท)</label>
          <input
            type="number"
            name="propertyPrice"
            value={formData.propertyPrice}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
          />
          {errors.propertyPrice && (
            <p className="text-red-600 text-sm mt-1">{errors.propertyPrice}</p>
          )}
        </div>

        {/* Interest Rate */}
        <div>
          <label className="block mb-1 font-medium">
            อัตราดอกเบี้ยต่อปี (%)
          </label>
          <input
            type="number"
            step="0.01"
            name="interestRate"
            value={formData.interestRate}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            min="0"
            max="25"
          />
          {errors.interestRate && (
            <p className="text-red-600 text-sm mt-1">{errors.interestRate}</p>
          )}
        </div>

        {/* Loan Term Years */}
        <div>
          <label className="block mb-1 font-medium">ระยะเวลากู้ (ปี)</label>
          <input
            type="number"
            name="loanTermYears"
            value={formData.loanTermYears}
            onChange={handleChange}
            className="w-full border rounded-lg px-3 py-2"
            min="1"
            max={MAX_TERM_YEARS}
          />
          {errors.loanTermYears && (
            <p className="text-red-600 text-sm mt-1">{errors.loanTermYears}</p>
          )}
          <p className="text-xs text-gray-500 mt-1">
            * ระบบจะจำกัดอัตโนมัติตามอายุเกษียณ {RETIREMENT_AGE} ปี
          </p>
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-center mt-2">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 transition shadow-sm"
          >
            คำนวณ
          </button>
        </div>
      </form>

      {/* ผลลัพธ์ */}
      {result && (
        <div id="loan-result" className="mt-8 space-y-6">
          {/* KPIs */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <StatCard
              label="วงเงินกู้ที่คาดว่าได้"
              value={thb(Math.floor(result.finalLoan))}
              unit="บาท"
              highlight
            />
            <StatCard
              label="ค่างวดต่อเดือน (ประมาณ)"
              value={thb(Math.ceil(result.monthlyPayment))}
              unit="บาท/เดือน"
              highlight
            />
            <StatCard
              label="เงินดาวน์ที่ต้องเตรียม"
              value={thb(Math.ceil(result.downPaymentNeeded))}
              unit="บาท"
              highlight
            />
          </div>

          {/* Terms */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="font-semibold mb-2">สรุปเงื่อนไขที่ใช้คำนวณ</div>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-y-1 text-sm text-gray-700">
              <li>
                <InfoLabel title="DSR = สัดส่วนค่างวดต่อรายได้สุทธิ สูงสุดที่ธนาคารยอมรับ">
                  เพดาน DSR
                </InfoLabel>
                : {(DSR * 100).toFixed(0)}% ของรายได้สุทธิ
              </li>
              <li>
                <InfoLabel title="LTV = สัดส่วนเงินกู้ต่อมูลค่าทรัพย์ (ธนาคารปล่อยกู้ได้ไม่เกินค่านี้)">
                  LTV ที่ใช้
                </InfoLabel>
                : {result.ltvPercent.toFixed(0)}%
              </li>
              <li>อายุสัญญาที่ใช้คำนวณ: {result.termYears} ปี</li>
            </ul>
          </div>

          {/* Breakdown */}
          <div className="rounded-xl border bg-white p-4 shadow-sm">
            <div className="font-semibold mb-2">รายละเอียดการคำนวณ</div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div className="rounded-lg border p-3">
                <div className="text-gray-600 mb-1">
                  ตามความสามารถผ่อน (รายได้)
                </div>
                <div className="tabular-nums">
                  ค่างวดที่ผ่อนไหว:{" "}
                  <span className="font-medium">
                    {thb(result.affordablePayment)}
                  </span>{" "}
                  บาท/เดือน
                </div>
                <div className="tabular-nums">
                  วงเงินจากรายได้:{" "}
                  <span className="font-medium">
                    {thb(Math.floor(result.loanByDSR))}
                  </span>{" "}
                  บาท
                </div>
              </div>
              <div className="rounded-lg border p-3">
                <div className="text-gray-600 mb-1">ตามมูลค่าทรัพย์ (LTV)</div>
                <div className="tabular-nums">
                  วงเงินจากราคา:{" "}
                  <span className="font-medium">
                    {thb(Math.floor(result.loanByLTV))}
                  </span>{" "}
                  บาท
                </div>
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500">
              * “วงเงินกู้ที่คาดว่าได้”
              คือค่าน้อยสุดระหว่างวงเงินจากรายได้และวงเงินจาก LTV
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

/* ========= Modal ========= */
export default function LoanCalculatorModal({ open, onOpenChange }) {
  // ประกาศ hooks ทั้งหมดก่อน return เงื่อนไข (ป้องกัน Hook order error)
  const contentRef = useRef(null);

  // ล็อกสกรอลล์ฉากหลัง (ให้กล่องภายในเลื่อนเอง)
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => e.key === "Escape" && onOpenChange(false);
    window.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  return (
    <div
      aria-modal="true"
      role="dialog"
      aria-labelledby="loan-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />

      {/* กล่อง Modal */}
      <div
        className="relative z-10 w-[92vw] max-w-3xl rounded-2xl bg-white shadow-xl max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header (จัดกลางจริงด้วย Grid) */}
        <div className="grid grid-cols-3 items-center rounded-t-2xl bg-gray-900 px-5 py-3 text-white shrink-0">
          {/* ช่องซ้ายเว้นไว้ให้บาลานซ์ */}
          <div />

          {/* ตรงกลาง */}
          <h3
            id="loan-modal-title"
            className="text-lg font-semibold justify-self-center"
          >
            คำนวณสินเชื่อบ้าน(โหมดง่าย)
          </h3>

          {/* ปุ่มปิดด้านขวา */}
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="justify-self-end text-gray-300 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content (เลื่อนแนวตั้ง) */}
        <div ref={contentRef} className="p-6 overflow-y-auto">
          <LoanCalculatorForm scrollRoot={contentRef} />
        </div>
      </div>
    </div>
  );
}
