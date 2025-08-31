import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema } from "@/components/schemas/authSchemas";
import { verifyandregister } from "@/api/auth";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [districts, setDistricts] = useState([]);
  const [provinces, setProvinces] = useState([]);
  const [loadingProvinces, setLoadingProvinces] = useState(true);
  const [loadingDistricts, setLoadingDistricts] = useState(false);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(verifyEmailSchema),
  });

  // โหลดรายชื่อจังหวัด
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
        setServerError("โหลดข้อมูลจังหวัดไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
      } finally {
        setLoadingProvinces(false);
      }
    })();
  }, []);

  // เปลี่ยนจังหวัด → โหลดอำเภอ
  const handleProvinceChange = async (e) => {
    const selectedProvince = e.target.value;
    setValue("Preferred_Province", selectedProvince);
    setValue("Preferred_District", "");

    const selectedProvinceId = provinces.find(
      (p) => p.name_th === selectedProvince
    )?.id;

    if (!selectedProvinceId) {
      setDistricts([]);
      return;
    }

    try {
      setLoadingDistricts(true);
      const res = await fetch(
        "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json"
      );
      const amphures = await res.json();
      const filtered = amphures.filter(
        (d) => d.province_id === selectedProvinceId
      );
      setDistricts(filtered);
    } catch (e) {
      setServerError("โหลดข้อมูลอำเภอไม่สำเร็จ กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoadingDistricts(false);
    }
  };

  const onSubmit = async (formData) => {
    setServerError("");
    try {
      const payload = { token, ...formData }; // flow นี้สมัครเป็น Buyer เสมอ
      const res = await verifyandregister(payload);
      alert(res.message || "ยืนยันอีเมลสำเร็จ");
      navigate("/login");
    } catch (err) {
      setServerError(
        err?.response?.data?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"
      );
    }
  };

  // ปุ่ม disabled ถ้ายังโหลดจังหวัดอยู่
  const submitDisabled = useMemo(
    () => isSubmitting || loadingProvinces,
    [isSubmitting, loadingProvinces]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-100 to-gray-200 flex items-center justify-center py-10 px-4">
      <div className="w-full max-w-2xl bg-white border border-gray-300 rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] ring-1 ring-gray-200 p-6 md:p-8">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="text-2xl font-semibold mt-2 text-gray-900">
            กรอกข้อมูลเพิ่มเติมเพื่อยืนยันการสมัคร
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            ข้อมูลนี้จะช่วยให้เราแนะนำบ้าน/คอนโดที่ตรงใจคุณมากขึ้น
          </p>
        </div>

        {/* Server error */}
        {serverError && (
          <div className="mb-5 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-4">
            {/* วันเกิด */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                วันเกิด <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                {...register("DateofBirth")}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2"
              />
              {errors.DateofBirth ? (
                <p className="text-red-500 text-sm mt-1">
                  {errors.DateofBirth.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">รูปแบบ: YYYY-MM-DD</p>
              )}
            </div>

            {/* อาชีพ */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                อาชีพ <span className="text-red-500">*</span>
              </label>
              <input
                {...register("Occupation")}
                placeholder="เช่น นักศึกษา / พนักงานบริษัท / ธุรกิจส่วนตัว"
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2"
              />
              {errors.Occupation && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Occupation.message}
                </p>
              )}
            </div>

            {/* รายได้ต่อเดือน */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                รายได้ต่อเดือน (บาท) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                {...register("Monthly_Income", { valueAsNumber: true })}
                placeholder="เช่น 30000"
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2"
              />
              {errors.Monthly_Income && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Monthly_Income.message}
                </p>
              )}
            </div>

            {/* จำนวนสมาชิกครอบครัว */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                จำนวนสมาชิกครอบครัว (คน) <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                inputMode="numeric"
                {...register("Family_Size", { valueAsNumber: true })}
                placeholder="เช่น 3"
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2"
              />
              {errors.Family_Size && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Family_Size.message}
                </p>
              )}
            </div>

            {/* จังหวัด */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                จังหวัดที่ต้องการ <span className="text-red-500">*</span>
              </label>
              <select
                {...register("Preferred_Province")}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2 disabled:bg-gray-100"
                onChange={handleProvinceChange}
                disabled={loadingProvinces}
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
              {errors.Preferred_Province && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Preferred_Province.message}
                </p>
              )}
            </div>

            {/* อำเภอ */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                อำเภอ/เขตที่ต้องการ <span className="text-red-500">*</span>
              </label>
              <select
                {...register("Preferred_District")}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2 disabled:bg-gray-100"
                disabled={loadingDistricts || !provinces.length}
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
              {errors.Preferred_District && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Preferred_District.message}
                </p>
              )}
            </div>

            {/* ความต้องการที่จอดรถ */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                ความต้องการที่จอดรถ <span className="text-red-500">*</span>
              </label>
              <select
                {...register("Parking_Needs")}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2"
              >
                <option value="">เลือกความต้องการที่จอดรถ</option>
                <option value="oneCar">1 คัน</option>
                <option value="twoCars">2 คัน</option>
                <option value="Not_required">ไม่ต้องการ</option>
              </select>
              {errors.Parking_Needs && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Parking_Needs.message}
                </p>
              )}
            </div>

            {/* สิ่งอำนวยความสะดวก */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                สิ่งอำนวยความสะดวกใกล้เคียง{" "}
                <span className="text-red-500">*</span>
              </label>
              <select
                {...register("Nearby_Facilities")}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2"
              >
                <option value="">เลือกสิ่งอำนวยความสะดวก</option>
                <option value="School">โรงเรียน</option>
                <option value="Hospital">โรงพยาบาล</option>
                <option value="Mall_Market">ห้าง/ตลาด</option>
                <option value="Park_Nature">สวนสาธารณะ</option>
              </select>
              {errors.Nearby_Facilities && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Nearby_Facilities.message}
                </p>
              )}
            </div>

            {/* ไลฟ์สไตล์ */}
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                รูปแบบการใช้ชีวิต <span className="text-red-500">*</span>
              </label>
              <select
                {...register("Lifestyle_Preferences")}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2"
              >
                <option value="">เลือกรูปแบบการใช้ชีวิต</option>
                <option value="Work_from_Home">ทำงานที่บ้าน</option>
                <option value="Have_Pets">เลี้ยงสัตว์</option>
                <option value="Need_a_Home_Office">ต้องการห้องทำงาน</option>
                <option value="Like_Gardening">ชอบทำสวน</option>
              </select>
              {errors.Lifestyle_Preferences && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Lifestyle_Preferences.message}
                </p>
              )}
            </div>

            {/* ความต้องการพิเศษ */}
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                ความต้องการพิเศษ (ถ้ามี)
              </label>
              <textarea
                {...register("Special_Requirements")}
                placeholder="เช่น ต้องการที่เงียบสงบ ใกล้ถนนใหญ่"
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2"
                rows="3"
              />
            </div>
          </div>

          {/* Submit */}
          <div className="mt-7">
            <button
              type="submit"
              disabled={submitDisabled}
              className="w-full h-11 inline-flex items-center justify-center rounded-md bg-[#2C3E50] text-white text-sm font-medium hover:bg-[#1a252f] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a252f] disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังบันทึกข้อมูล...
                </span>
              ) : loadingProvinces ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังโหลดจังหวัด...
                </span>
              ) : (
                "ยืนยันข้อมูล"
              )}
            </button>
          </div>

          {/* หมายเหตุเล็ก ๆ */}
          <p className="text-xs text-gray-500 mt-3 text-center">
            *
            ข้อมูลของคุณจะถูกเก็บเป็นความลับและใช้เพื่อการแนะนำที่อยู่อาศัยเท่านั้น
          </p>
        </form>
      </div>
    </div>
  );
};

export default VerifyEmail;
