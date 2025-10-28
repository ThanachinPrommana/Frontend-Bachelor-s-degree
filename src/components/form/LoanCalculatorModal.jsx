import React, { useEffect, useState } from "react";

/* ========= ฟอร์มคำนวณ ========= */
function LoanCalculatorForm() {
  const [formData, setFormData] = useState({
    occupation: "",
    houseType: "",
    firstHome: "",
    age: "",
    income: "",
    monthlyIncome: "",
    debt: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("คำนวณด้วยข้อมูล:", formData);
    // TODO: ใส่สูตรคำนวณ/เรียก API ที่นี่
  };

  return (
    <div>
      <h2 className="text-center text-2xl font-semibold mb-6">
        ทดลองคำนวณวงเงินกู้สินเชื่อบ้าน เบื้องต้น
      </h2>

      <form
        onSubmit={handleSubmit}
        className="grid grid-cols-1 md:grid-cols-2 gap-6"
      >
        {/* Occupation */}
        <div>
          <label className="block mb-1 font-medium">Occupation</label>
          <select
            name="occupation"
            value={formData.occupation}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Occupation</option>
            <option value="employee">Employee</option>
            <option value="freelancer">Freelancer</option>
            <option value="business">Business Owner</option>
          </select>
        </div>

        {/* House Type */}
        <div>
          <label className="block mb-1 font-medium">Type of House</label>
          <select
            name="houseType"
            value={formData.houseType}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select Type of House</option>
            <option value="single">Single House</option>
            <option value="townhome">Townhome</option>
            <option value="condo">Condominium</option>
          </select>
        </div>

        {/* Age */}
        <div>
          <label className="block mb-1 font-medium">
            Borrower's Age (years)
          </label>
          <input
            type="number"
            name="age"
            value={formData.age}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
            min="0"
          />
        </div>

        {/* First Home */}
        <div>
          <label className="block mb-1 font-medium">
            Is this your first home loan?
          </label>
          <select
            name="firstHome"
            value={formData.firstHome}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="">Select First Home Loan Status</option>
            <option value="yes">Yes</option>
            <option value="no">No</option>
          </select>
        </div>

        {/* Net Income */}
        <div>
          <label className="block mb-1 font-medium">
            Monthly Net Income (Baht)
          </label>
          <input
            type="number"
            name="income"
            value={formData.income}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
            min="0"
          />
        </div>

        {/* Monthly Income */}
        <div>
          <label className="block mb-1 font-medium">Monthly income</label>
          <input
            type="number"
            name="monthlyIncome"
            value={formData.monthlyIncome}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
            min="0"
          />
        </div>

        {/* Debt */}
        <div>
          <label className="block mb-1 font-medium">
            Monthly Debt Obligations (Baht)
          </label>
          <input
            type="number"
            name="debt"
            value={formData.debt}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
            placeholder="0"
            min="0"
          />
        </div>

        {/* Submit */}
        <div className="md:col-span-2 flex justify-center mt-4">
          <button
            type="submit"
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
          >
            คำนวณ
          </button>
        </div>
      </form>
    </div>
  );
}

/* ========= Modal (ควบคุมจากภายนอก) ========= */
export default function LoanCalculatorModal({ open, onOpenChange }) {
  // ปิดด้วย ESC + ล็อกสกอร์ลตอนเปิด
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
      {/* Backdrop โปร่งใส (ไม่ดำทึบ) */}
      <div
        className="absolute inset-0 bg-black/40"
        onClick={() => onOpenChange(false)}
      />

      {/* กล่อง Modal */}
      <div
        className="relative z-10 w-[92vw] max-w-3xl rounded-lg bg-white shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between rounded-t-lg bg-gray-800 px-5 py-3 text-white">
          <h3 id="loan-modal-title" className="text-lg font-semibold">
            คำนวณสินเชื่อบ้าน
          </h3>
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close"
            className="text-gray-300 hover:text-white text-2xl leading-none"
          >
            ×
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <LoanCalculatorForm />
        </div>
      </div>
    </div>
  );
}
