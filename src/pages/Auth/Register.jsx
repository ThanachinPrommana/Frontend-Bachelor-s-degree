// src/pages/Auth/Register.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/components/schemas/authSchemas";
import { preregister } from "@/api/auth";
import Logo from "@/components/Logo";
import {
  Loader2,
  User,
  Mail,
  Phone as PhoneIcon,
  Lock,
  Eye,
  EyeOff,
  IdCard,
  Home as HomeIcon,
} from "lucide-react";

/* shadcn/ui Select สำหรับ dropdown จังหวัด/อำเภอ/ตำบล */
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/* Endpoints: kongvut data (latest) */
const PROVINCE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province.json";
const DISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/district.json";
const SUBDISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district.json";

const norm = (s) => String(s ?? "").trim();
function assertOk(res, msg) {
  if (!res.ok) throw new Error(`${msg} (HTTP ${res.status})`);
  return res;
}
const digitsOnly = (s) => (s || "").replace(/\D/g, "");

const Register = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  /* ===== โหลดจังหวัด/อำเภอ/ตำบล ===== */
  const [provinces, setProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSubDistricts, setAllSubDistricts] = useState([]);
  const [geoLoading, setGeoLoading] = useState(true);
  const abortRef = useRef(null);

  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setGeoLoading(true);
        const [provRes, distRes, subRes] = await Promise.all([
          fetch(PROVINCE_URL, { signal: controller.signal })
            .then((r) => assertOk(r, "โหลดจังหวัดล้มเหลว"))
            .then((r) => r.json()),
          fetch(DISTRICT_URL, { signal: controller.signal })
            .then((r) => assertOk(r, "โหลดอำเภอล้มเหลว"))
            .then((r) => r.json()),
          fetch(SUBDISTRICT_URL, { signal: controller.signal })
            .then((r) => assertOk(r, "โหลดตำบลล้มเหลว"))
            .then((r) => r.json()),
        ]);
        setProvinces(provRes || []);
        setAllDistricts(distRes || []);
        setAllSubDistricts(subRes || []);
      } catch (e) {
        if (e?.name !== "AbortError") console.error(e);
      } finally {
        setGeoLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  /* ===== index maps ===== */
  const districtsByProv = useMemo(() => {
    const m = new Map();
    for (const d of allDistricts) {
      const k = String(d.province_id);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(d);
    }
    return m;
  }, [allDistricts]);

  const subDistrictsByDist = useMemo(() => {
    const m = new Map();
    for (const sd of allSubDistricts) {
      const k = String(sd.district_id);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(sd);
    }
    return m;
  }, [allSubDistricts]);

  /* เรียงจังหวัดตามชื่อไทย */
  const allProvinceList = useMemo(() => {
    return [...provinces].sort((a, b) =>
      String(a.name_th).localeCompare(String(b.name_th), "th")
    );
  }, [provinces]);

  /* ===== react-hook-form ===== */
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    resetField,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      First_name: "",
      Last_name: "",
      Email: "",
      Phone: "",
      Password: "",
      ConfirmPassword: "",
      nationalId: "",
      regAddress: {
        houseNo: "",
        village: "",
        alley: "",
        road: "",
        subdistrict: "",
        district: "",
        province: "",
      },
    },
  });

  /* watch ค่าที่อยู่ */
  const currentProvince = watch("regAddress.province");
  const currentDistrict = watch("regAddress.district");

  const derivedDistricts = useMemo(() => {
    if (!currentProvince) return [];
    const p = provinces.find((x) => norm(x.name_th) === norm(currentProvince));
    return p ? districtsByProv.get(String(p.id)) || [] : [];
  }, [currentProvince, provinces, districtsByProv]);

  const derivedSubDistricts = useMemo(() => {
    if (!currentDistrict) return [];
    const d = derivedDistricts.find(
      (x) => norm(x.name_th) === norm(currentDistrict)
    );
    return d ? subDistrictsByDist.get(String(d.id)) || [] : [];
  }, [currentDistrict, derivedDistricts, subDistrictsByDist]);

  /* ===== onChange: คงค่าเดิมถ้ายังถูกต้อง ===== */
  const handleProvinceChange = (provinceName) => {
    setValue("regAddress.province", provinceName, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const p = provinces.find((x) => norm(x.name_th) === norm(provinceName));
    const nextDistricts = p ? districtsByProv.get(String(p.id)) || [] : [];

    const currDistrict = watch("regAddress.district");
    const stillValidDistrict = nextDistricts.some(
      (d) => norm(d.name_th) === norm(currDistrict)
    );

    if (!stillValidDistrict) {
      resetField("regAddress.district");
      resetField("regAddress.subdistrict");
    } else {
      const d = nextDistricts.find(
        (x) => norm(x.name_th) === norm(currDistrict)
      );
      const nextSubdistricts = d
        ? subDistrictsByDist.get(String(d.id)) || []
        : [];
      const currSubdistrict = watch("regAddress.subdistrict");
      const stillValidSubdistrict = nextSubdistricts.some(
        (sd) => norm(sd.name_th) === norm(currSubdistrict)
      );
      if (!stillValidSubdistrict) resetField("regAddress.subdistrict");
    }
  };

  const handleDistrictChange = (districtName) => {
    setValue("regAddress.district", districtName, {
      shouldDirty: true,
      shouldValidate: true,
    });

    const d = derivedDistricts.find(
      (x) => norm(x.name_th) === norm(districtName)
    );
    const nextSubdistricts = d
      ? subDistrictsByDist.get(String(d.id)) || []
      : [];

    const currSubdistrict = watch("regAddress.subdistrict");
    const stillValidSubdistrict = nextSubdistricts.some(
      (sd) => norm(sd.name_th) === norm(currSubdistrict)
    );
    if (!stillValidSubdistrict) resetField("regAddress.subdistrict");
  };

  /* ===== submit ===== */
  const onSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);
    try {
      const payload = { ...data, userType: "Buyer" };
      const res = await preregister(payload);
      const message = res?.data?.message || res?.message || "สมัครสมาชิกสำเร็จ";
      alert(message);
      
      const token = res?.data?.token || res?.token;
      if (token) {
        navigate(`/verifyemail?token=${token}`);
      } else {
        navigate("/login");
      }
    } catch (err) {
      setServerError(
        err?.response?.data?.message || err?.message || "Server error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center">
      {/* BG */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/5b/b4/5d/5bb45dd8bf2c2ecba1bbda8c656a2018.jpg')",
        }}
      />
      <div className="absolute inset-0 bg-white/75 backdrop-blur-md" />

      {/* Card */}
      <div className="relative z-10 w-full max-w-3xl bg-white/95 rounded-2xl shadow-2xl ring-1 ring-gray-200 p-8 md:p-10">
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-2">
            สมัครสมาชิก
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            กรอกข้อมูลให้ครบถ้วนเพื่อสร้างบัญชีของคุณ
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md text-sm text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
            {/* First name (บังคับ) */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                ชื่อ <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative rounded-md border ${
                  errors.First_name ? "border-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
              >
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <User className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  {...register("First_name")}
                  className="w-full pl-10 pr-3 py-2 rounded-md outline-none bg-transparent"
                  placeholder="ชื่อจริง"
                  autoComplete="given-name"
                  aria-required="true"
                />
              </div>
              {errors.First_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.First_name.message}
                </p>
              )}
            </div>

            {/* Last name (บังคับ) */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                นามสกุล <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative rounded-md border ${
                  errors.Last_name ? "border-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
              >
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <User className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  {...register("Last_name")}
                  className="w-full pl-10 pr-3 py-2 rounded-md outline-none bg-transparent"
                  placeholder="นามสกุล"
                  autoComplete="family-name"
                  aria-required="true"
                />
              </div>
              {errors.Last_name && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Last_name.message}
                </p>
              )}
            </div>

            {/* Email (บังคับ) */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                อีเมล <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative rounded-md border ${
                  errors.Email ? "border-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
              >
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Mail className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type="email"
                  {...register("Email")}
                  className="w-full pl-10 pr-3 py-2 rounded-md outline-none bg-transparent"
                  placeholder="your@email.com"
                  autoComplete="email"
                  aria-required="true"
                />
              </div>
              {errors.Email ? (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Email.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">
                  ใช้สำหรับยืนยันตัวตน/เข้าสู่ระบบ
                </p>
              )}
            </div>

            {/* Phone (บังคับ) */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                เบอร์โทรศัพท์ <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative rounded-md border ${
                  errors.Phone ? "border-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
              >
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <PhoneIcon className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type="tel"
                  inputMode="numeric"
                  pattern="[0-9]*"
                  {...register("Phone")}
                  className="w-full pl-10 pr-3 py-2 rounded-md outline-none bg-transparent"
                  placeholder="0891234567"
                  autoComplete="tel"
                  aria-required="true"
                />
              </div>
              {errors.Phone ? (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Phone.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">ตัวเลข 9–10 หลัก</p>
              )}
            </div>

            {/* Password (บังคับ) */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                รหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative rounded-md border ${
                  errors.Password ? "border-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
              >
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type={showPw ? "text" : "password"}
                  {...register("Password")}
                  className="w-full pl-10 pr-10 py-2 rounded-md outline-none bg-transparent"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowPw((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showPw ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showPw ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.Password && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Password.message}
                </p>
              )}
            </div>

            {/* Confirm Password (บังคับ) */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                ยืนยันรหัสผ่าน <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative rounded-md border ${
                  errors.ConfirmPassword ? "border-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
              >
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <Lock className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  type={showConfirm ? "text" : "password"}
                  {...register("ConfirmPassword")}
                  className="w-full pl-10 pr-10 py-2 rounded-md outline-none bg-transparent"
                  placeholder="••••••••"
                  autoComplete="new-password"
                  aria-required="true"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((v) => !v)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  aria-label={showConfirm ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                >
                  {showConfirm ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                </button>
              </div>
              {errors.ConfirmPassword && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.ConfirmPassword.message}
                </p>
              )}
            </div>

            {/* National ID (บังคับ) */}
            <div className="md:col-span-2">
              <label className="block text-sm mb-1 text-gray-700">
                เลขบัตรประชาชน (13 หลัก) <span className="text-red-500">*</span>
              </label>
              <div
                className={`relative rounded-md border ${
                  errors.nationalId ? "border-red-500" : "border-gray-300"
                } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
              >
                <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                  <IdCard className="w-4 h-4 text-gray-400" />
                </span>
                <input
                  {...register("nationalId")}
                  inputMode="numeric"
                  maxLength={13}
                  onInput={(e) => {
                    const v = digitsOnly(e.currentTarget.value).slice(0, 13);
                    e.currentTarget.value = v;
                    setValue("nationalId", v, { shouldValidate: true });
                  }}
                  className="w-full pl-10 pr-3 py-2 rounded-md outline-none bg-transparent"
                  placeholder="กรอกเลข 13 หลัก"
                  autoComplete="off"
                  aria-required="true"
                />
              </div>
              {errors.nationalId && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.nationalId.message}
                </p>
              )}
            </div>

            {/* Registered Address */}
            <div className="md:col-span-2">
              <h3 className="text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <HomeIcon className="w-4 h-4 text-gray-500" />
                ที่อยู่ตามทะเบียนบ้าน <span className="text-red-500">*</span>
              </h3>

              {/* แถวที่ 1: houseNo (บังคับ) / village (ไม่บังคับ) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    เลขที่บ้าน <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register("regAddress.houseNo")}
                    className={`w-full border ${
                      errors.regAddress?.houseNo
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400`}
                    placeholder="เช่น 123/45"
                    aria-required="true"
                  />
                  {errors.regAddress?.houseNo && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.regAddress.houseNo.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    หมู่บ้าน/อาคาร {/* ไม่มี * */}
                  </label>
                  <input
                    {...register("regAddress.village")}
                    className={`w-full border ${
                      errors.regAddress?.village
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400`}
                    placeholder="เช่น หมู่บ้าน/คอนโด (ไม่บังคับ)"
                    aria-required="false"
                  />
                  {errors.regAddress?.village && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.regAddress.village.message}
                    </p>
                  )}
                </div>
              </div>

              {/* แถวที่ 2: alley (ไม่บังคับ) / road (ไม่บังคับ) */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    ซอย {/* ไม่มี * */}
                  </label>
                  <input
                    {...register("regAddress.alley")}
                    className={`w-full border ${
                      errors.regAddress?.alley
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400`}
                    placeholder="เช่น ซอย 5 (ไม่บังคับ)"
                    aria-required="false"
                  />
                  {errors.regAddress?.alley && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.regAddress.alley.message}
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    ถนน {/* ไม่มี * */}
                  </label>
                  <input
                    {...register("regAddress.road")}
                    className={`w-full border ${
                      errors.regAddress?.road
                        ? "border-red-500"
                        : "border-gray-300"
                    } rounded-md p-2 focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400`}
                    placeholder="เช่น สุขุมวิท (ไม่บังคับ)"
                    aria-required="false"
                  />
                  {errors.regAddress?.road && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.regAddress.road.message}
                    </p>
                  )}
                </div>
              </div>

              {/* แถวที่ 3: จังหวัด / อำเภอ / ตำบล (บังคับทั้ง 3) */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-3">
                {/* จังหวัด */}
                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    จังหวัด <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={currentProvince || ""}
                    onValueChange={handleProvinceChange}
                    disabled={geoLoading}
                  >
                    <SelectTrigger
                      className={`h-10 ${
                        errors.regAddress?.province
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          geoLoading ? "กำลังโหลด..." : "เลือกจังหวัด"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {allProvinceList.map((prov) => (
                        <SelectItem key={prov.id} value={prov.name_th}>
                          {prov.name_th}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.regAddress?.province && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.regAddress.province.message}
                    </p>
                  )}
                </div>

                {/* อำเภอ/เขต */}
                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    อำเภอ/เขต <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={currentDistrict || ""}
                    onValueChange={handleDistrictChange}
                    disabled={geoLoading || derivedDistricts.length === 0}
                  >
                    <SelectTrigger
                      className={`h-10 ${
                        errors.regAddress?.district
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          derivedDistricts.length
                            ? "เลือกอำเภอ/เขต"
                            : "เลือกจังหวัดก่อน"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {derivedDistricts.map((d) => (
                        <SelectItem key={d.id} value={d.name_th}>
                          {d.name_th}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.regAddress?.district && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.regAddress.district.message}
                    </p>
                  )}
                </div>

                {/* ตำบล/แขวง */}
                <div>
                  <label className="block text-xs mb-1 text-gray-700">
                    ตำบล/แขวง <span className="text-red-500">*</span>
                  </label>
                  <Select
                    value={watch("regAddress.subdistrict") || ""}
                    onValueChange={(v) =>
                      setValue("regAddress.subdistrict", v, {
                        shouldDirty: true,
                        shouldValidate: true,
                      })
                    }
                    disabled={geoLoading || derivedSubDistricts.length === 0}
                  >
                    <SelectTrigger
                      className={`h-10 ${
                        errors.regAddress?.subdistrict
                          ? "border-red-500"
                          : "border-gray-300"
                      }`}
                    >
                      <SelectValue
                        placeholder={
                          derivedSubDistricts.length
                            ? "เลือกตำบล/แขวง"
                            : "เลือกอำเภอก่อน"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {derivedSubDistricts.map((sd) => (
                        <SelectItem key={sd.id} value={sd.name_th}>
                          {sd.name_th}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.regAddress?.subdistrict && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.regAddress.subdistrict.message}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit */}
          <div className="mt-6">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-11 inline-flex items-center justify-center rounded-md bg-[#2C3E50] text-white text-sm font-medium hover:bg-[#1a252f] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a252f] disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังสมัครสมาชิก...
                </span>
              ) : (
                "สมัครสมาชิก"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Register;
