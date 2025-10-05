// src/pages/Auth/VerifyEmail.jsx
import { useForm } from "react-hook-form";
import { useSearchParams, useNavigate } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { verifyEmailSchema } from "@/components/schemas/authSchemas";
import { verifyandregister } from "@/api/auth";
import { useEffect, useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";

const PROVINCE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province.json";
const DISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/district.json";
const SUBDISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district.json";

function assertOk(res, errMsg) {
  if (!res.ok) throw new Error(`${errMsg} (HTTP ${res.status})`);
  return res;
}

const VerifyEmail = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  // ข้อมูลตำแหน่งที่ตั้ง
  const [provinces, setProvinces] = useState([]);
  const [districtsAll, setDistrictsAll] = useState([]);
  const [subDistrictsAll, setSubDistrictsAll] = useState([]);

  // state สำหรับการเลือกปัจจุบัน
  const [selectedProvinceId, setSelectedProvinceId] = useState(null);
  const [selectedDistrictId, setSelectedDistrictId] = useState(null);

  const [loadingLoc, setLoadingLoc] = useState(true);
  const [serverError, setServerError] = useState("");

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(verifyEmailSchema),
  });

  // โหลดจังหวัด/อำเภอ/ตำบลครั้งเดียว
  useEffect(() => {
    let aborted = false;
    (async () => {
      try {
        setServerError("");
        setLoadingLoc(true);
        const [provRes, distRes, subRes] = await Promise.all([
          fetch(PROVINCE_URL, { cache: "no-store" })
            .then((r) => assertOk(r, "โหลดข้อมูลจังหวัดล้มเหลว"))
            .then((r) => r.json()),
          fetch(DISTRICT_URL, { cache: "no-store" })
            .then((r) => assertOk(r, "โหลดข้อมูลอำเภอล้มเหลว"))
            .then((r) => r.json()),
          fetch(SUBDISTRICT_URL, { cache: "no-store" })
            .then((r) => assertOk(r, "โหลดข้อมูลตำบลล้มเหลว"))
            .then((r) => r.json()),
        ]);
        if (aborted) return;
        setProvinces(provRes);
        setDistrictsAll(distRes);
        setSubDistrictsAll(subRes);
      } catch (e) {
        if (!aborted)
          setServerError(
            "โหลดข้อมูลจังหวัด/อำเภอ/ตำบลไม่สำเร็จ กรุณาลองใหม่อีกครั้ง"
          );
      } finally {
        if (!aborted) setLoadingLoc(false);
      }
    })();
    return () => {
      aborted = true;
    };
  }, []);

  // เมื่อเลือกจังหวัด → reset อำเภอและตำบล, เก็บชื่อจังหวัดลงฟอร์ม
  const handleProvinceChange = (e) => {
    const id = Number(e.target.value || 0);
    setSelectedProvinceId(id || null);
    setSelectedDistrictId(null);
    setValue("Preferred_District", "");
    setValue("Preferred_Subdistrict", "");

    const province = provinces.find((p) => p.id === id);
    setValue("Preferred_Province", province?.name_th || "");
  };

  // เมื่อเลือกอำเภอ → reset ตำบล, เก็บชื่ออำเภอลงฟอร์ม และเก็บ id ไว้หา sub-district
  const handleDistrictChange = (e) => {
    const id = Number(e.target.value || 0);
    setSelectedDistrictId(id || null);
    setValue("Preferred_Subdistrict", "");

    const district = districtsAll.find((d) => d.id === id);
    // เก็บ "ชื่ออำเภอ" (ไม่ใช่ id) ลงใน Preferred_District (ตาม schema ฝั่ง backend)
    setValue("Preferred_District", district?.name_th || "");
  };

  // อำเภอตามจังหวัดที่เลือก
  const districts = useMemo(() => {
    if (!selectedProvinceId) return [];
    return districtsAll.filter((d) => d.province_id === selectedProvinceId);
  }, [districtsAll, selectedProvinceId]);

  // ตำบลตามอำเภอที่เลือก (รองรับทั้ง district_id และ amphure_id)
  const subDistricts = useMemo(() => {
    if (!selectedDistrictId) return [];
    return subDistrictsAll.filter((s) => {
      const key = "district_id" in s ? "district_id" : "amphure_id";
      return s[key] === selectedDistrictId;
    });
  }, [subDistrictsAll, selectedDistrictId]);

  const onSubmit = async (formData) => {
    setServerError("");
    try {
      const payload = { token, ...formData };
      const res = await verifyandregister(payload);
      alert(res.message || "ยืนยันอีเมลสำเร็จ");
      navigate("/login");
    } catch (err) {
      setServerError(
        err?.response?.data?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์"
      );
    }
  };

  const submitDisabled = isSubmitting || loadingLoc;

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
                onChange={handleProvinceChange}
                disabled={loadingLoc}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2 disabled:bg-gray-100"
              >
                <option value="">
                  {loadingLoc ? "กำลังโหลดจังหวัด..." : "เลือกจังหวัด"}
                </option>
                {provinces.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name_th}
                  </option>
                ))}
              </select>

              {/* เก็บ “ชื่อจังหวัด” ในฟอร์ม (ไม่ใช่ id) */}
              <input type="hidden" {...register("Preferred_Province")} />

              {errors.Preferred_Province && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Preferred_Province.message}
                </p>
              )}
            </div>

            {/* อำเภอ/เขต */}
            <div>
              <label className="block mb-1 text-sm font-medium text-gray-700">
                อำเภอ/เขตที่ต้องการ <span className="text-red-500">*</span>
              </label>
              <select
                onChange={handleDistrictChange}
                disabled={!selectedProvinceId || loadingLoc}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2 disabled:bg-gray-100"
              >
                <option value="">
                  {selectedProvinceId ? "เลือกอำเภอ/เขต" : "เลือกจังหวัดก่อน"}
                </option>
                {districts.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name_th}
                  </option>
                ))}
              </select>

              {/* เก็บ “ชื่ออำเภอ” ลงฟอร์ม */}
              <input type="hidden" {...register("Preferred_District")} />

              {errors.Preferred_District && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Preferred_District.message}
                </p>
              )}
            </div>

            {/* ตำบล/แขวง */}
            <div className="md:col-span-2">
              <label className="block mb-1 text-sm font-medium text-gray-700">
                ตำบล/แขวงที่ต้องการ <span className="text-red-500">*</span>
              </label>
              <select
                {...register("Preferred_Subdistrict")}
                disabled={!selectedDistrictId || loadingLoc}
                className="w-full border border-gray-300 focus:border-gray-400 focus:ring-2 focus:ring-gray-200 rounded-md p-2 disabled:bg-gray-100"
              >
                <option value="">
                  {selectedDistrictId ? "เลือกตำบล/แขวง" : "เลือกอำเภอก่อน"}
                </option>
                {subDistricts.map((s) => (
                  <option key={s.id} value={s.name_th}>
                    {s.name_th}
                  </option>
                ))}
              </select>
              {errors.Preferred_Subdistrict && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Preferred_Subdistrict.message}
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
                rows={3}
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
              ) : loadingLoc ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังโหลดข้อมูลจังหวัด/อำเภอ/ตำบล...
                </span>
              ) : (
                "ยืนยันข้อมูล"
              )}
            </button>
          </div>

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
