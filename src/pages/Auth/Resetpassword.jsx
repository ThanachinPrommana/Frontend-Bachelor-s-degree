import { useForm } from "react-hook-form";
import { useNavigate, useSearchParams } from "react-router-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { resetPasswordSchema } from "@/components/schemas/authSchemas";
import { resetpassword } from "@/api/auth";
import { useMemo, useState } from "react";
import {
  Loader2,
  Lock,
  Eye,
  EyeOff,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import Logo from "@/components/Logo";

const Resetpassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const navigate = useNavigate();

  const [serverError, setServerError] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [done, setDone] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(resetPasswordSchema),
    mode: "onSubmit",
  });

  // ปิดปุ่มถ้าไม่มี token หรือกำลัง submit
  const submitDisabled = useMemo(
    () => isSubmitting || !token,
    [isSubmitting, token]
  );

  const onSubmit = async (data) => {
    if (!token) {
      setServerError("ลิงก์หมดอายุหรือไม่ถูกต้อง");
      return;
    }
    setServerError("");
    try {
      await resetpassword({ token, Password: data.Password });
      setDone(true);
      reset();
      setTimeout(() => navigate("/login"), 1200);
    } catch (err) {
      const msg =
        err?.response?.data?.message ??
        (err?.message?.includes("Network")
          ? "เครือข่ายมีปัญหา กรุณาลองใหม่อีกครั้ง"
          : null) ??
        "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
      setServerError(msg);
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
      {/* ขาวจาง + เบลอเพื่ออ่านง่าย */}
      <div className="absolute inset-0 bg-white/75 backdrop-blur-md" />

      {/* การ์ดฟอร์ม */}
      <div className="relative z-10 w-full max-w-md bg-white/95 rounded-2xl shadow-2xl ring-1 ring-gray-200 p-6 md:p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            ตั้งรหัสผ่านใหม่
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            กำหนดรหัสผ่านใหม่สำหรับบัญชีของคุณ
          </p>
        </div>

        {/* แจ้งเตือน token หาย */}
        {!token && (
          <div className="mb-4 flex items-start gap-2 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md text-sm">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span>ไม่พบโทเคนรีเซ็ตรหัสผ่านหรือลิงก์หมดอายุ</span>
          </div>
        )}

        {/* error จากเซิร์ฟเวอร์ */}
        {serverError && (
          <div className="mb-4 flex items-start gap-2 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md text-sm">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* สถานะสำเร็จ */}
        {done ? (
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
            <h2 className="text-lg font-medium text-green-700 mt-2">
              ตั้งรหัสผ่านใหม่สำเร็จ
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              กำลังพาคุณไปยังหน้าเข้าสู่ระบบ...
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Password */}
            <label className="block text-sm mb-1 text-gray-700">
              รหัสผ่านใหม่
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
                inputMode="text"
                {...register("Password")}
                className="w-full pl-10 pr-10 py-2 rounded-md outline-none bg-transparent"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                required
                aria-invalid={!!errors.Password}
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
            {errors.Password ? (
              <p className="text-red-500 text-sm mt-1">
                {errors.Password.message}
              </p>
            ) : (
              <p className="text-xs text-gray-500 mt-1">อย่างน้อย 6 ตัวอักษร</p>
            )}

            {/* Confirm Password */}
            <label className="block text-sm mb-1 text-gray-700 mt-4">
              ยืนยันรหัสผ่านใหม่
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
                inputMode="text"
                {...register("ConfirmPassword")}
                className="w-full pl-10 pr-10 py-2 rounded-md outline-none bg-transparent"
                placeholder="••••••••"
                autoComplete="new-password"
                minLength={6}
                required
                aria-invalid={!!errors.ConfirmPassword}
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

            <button
              type="submit"
              disabled={submitDisabled}
              className="mt-5 w-full h-11 inline-flex items-center justify-center rounded-md bg-[#2C3E50] text-white text-sm font-medium hover:bg-[#1a252f] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a252f] disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังบันทึกรหัสผ่าน...
                </span>
              ) : (
                "ตั้งรหัสผ่านใหม่"
              )}
            </button>

            {/* hint เล็ก ๆ */}
            <p className="text-xs text-gray-500 mt-3 text-center">
              หากลิงก์หมดอายุ กรุณาขอรีเซ็ตใหม่จากเมนู “ลืมรหัสผ่าน”
            </p>
          </form>
        )}
      </div>
    </div>
  );
};

export default Resetpassword;
