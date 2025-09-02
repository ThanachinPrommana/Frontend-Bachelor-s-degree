import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSchema } from "@/components/schemas/authSchemas";
import { preregister } from "@/api/auth";
import Logo from "@/components/Logo";
import { useState } from "react";
import {
  Loader2,
  User,
  Mail,
  Phone as PhoneIcon,
  Lock,
  Eye,
  EyeOff,
} from "lucide-react";

const Register = () => {
  const navigate = useNavigate();
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({ resolver: zodResolver(registerSchema) });

  const onSubmit = async (data) => {
    setServerError("");
    setIsSubmitting(true);
    try {
      const payload = { ...data, userType: "Buyer" };
      const res = await preregister(payload);
      const message = res?.data?.message || res?.message || "สมัครสมาชิกสำเร็จ";
      alert(message);
      navigate("/login");
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
      {/* พื้นหลังเป็นรูปบ้าน */}
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage:
            "url('https://i.pinimg.com/736x/5b/b4/5d/5bb45dd8bf2c2ecba1bbda8c656a2018.jpg')",
        }}
      />
      {/* ทำให้ “ขาวจาง + เบลอ” เหมือนหน้า Forgot */}
      <div className="absolute inset-0 bg-white/75 backdrop-blur-md" />

      {/* การ์ดฟอร์ม */}
      <div className="relative z-10 w-full max-w-2xl bg-white/95 rounded-2xl shadow-2xl ring-1 ring-gray-200 p-8 md:p-10">
        {/* Header */}
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="text-2xl md:text-3xl font-semibold text-gray-900 mt-2">
            สมัครสมาชิก
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            กรอกข้อมูลด้านล่างเพื่อสร้างบัญชีใหม่
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md text-sm text-center">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-4">
            {/* First name */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">ชื่อ</label>
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
                />
              </div>
              {errors.First_name ? (
                <p className="text-red-500 text-sm mt-1">
                  {errors.First_name.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">กรอกชื่อจริงของคุณ</p>
              )}
            </div>

            {/* Last name */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                นามสกุล
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
                />
              </div>
              {errors.Last_name ? (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Last_name.message}
                </p>
              ) : (
                <p className="text-xs text-gray-500 mt-1">กรอกนามสกุลของคุณ</p>
              )}
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">อีเมล</label>
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

            {/* Phone */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                เบอร์โทรศัพท์
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

            {/* Password */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                รหัสผ่าน
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

            {/* Confirm Password */}
            <div>
              <label className="block text-sm mb-1 text-gray-700">
                ยืนยันรหัสผ่าน
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
          </div>

          {/* ปุ่มสมัคร */}
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
