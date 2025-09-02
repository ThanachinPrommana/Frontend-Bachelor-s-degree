import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { forgotPasswordSchema } from "@/components/schemas/authSchemas";
import { forgotpassword } from "@/api/auth";
import { Loader2, Mail, CheckCircle2, AlertCircle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import Logo from "@/components/Logo";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [serverError, setServerError] = useState("");
  const [sent, setSent] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    resolver: zodResolver(forgotPasswordSchema),
  });

  const onSubmit = async (data) => {
    setServerError("");
    try {
      const res = await forgotpassword(data);
      setSent(true);
      alert(res?.message || "ส่งลิงก์รีเซ็ตรหัสผ่านไปยังอีเมลเรียบร้อยแล้ว");
      reset();
    } catch (err) {
      const msg =
        err?.response?.data?.message || "เกิดข้อผิดพลาดจากเซิร์ฟเวอร์";
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
      {/* ปรับ overlay ให้ขาวจาง + เบลอเต็มจอ */}
      <div className="absolute inset-0 bg-white/75 backdrop-blur-md" />

      {/* กล่องฟอร์ม */}
      <div className="relative z-10 w-full max-w-md bg-white/95 rounded-2xl shadow-2xl ring-1 ring-gray-200 p-6 md:p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h1 className="text-2xl font-semibold text-gray-900 mt-2">
            ลืมรหัสผ่าน
          </h1>
          <p className="text-sm text-gray-500 mt-1 text-center">
            กรอกอีเมลของคุณเพื่อรับลิงก์สำหรับรีเซ็ตรหัสผ่าน
          </p>
        </div>

        {/* error */}
        {serverError && (
          <div className="mb-4 flex items-start gap-2 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md text-sm">
            <AlertCircle className="w-5 h-5 mt-0.5" />
            <span>{serverError}</span>
          </div>
        )}

        {/* success */}
        {sent ? (
          <div className="text-center">
            <CheckCircle2 className="w-10 h-10 text-green-600 mx-auto" />
            <h2 className="text-lg font-medium text-green-700 mt-2">
              ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว
            </h2>
            <p className="text-sm text-gray-600 mt-1">
              กรุณาตรวจสอบอีเมลของคุณ หากไม่พบให้เช็กโฟลเดอร์สแปม
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                onClick={() => setSent(false)}
                className="w-full h-11 inline-flex items-center justify-center rounded-md border border-gray-300 text-gray-700 hover:bg-gray-50 transition"
              >
                ส่งอีกครั้ง
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full h-11 inline-flex items-center justify-center rounded-md bg-[#2C3E50] text-white hover:bg-[#1a252f] transition"
              >
                กลับไปเข้าสู่ระบบ
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit(onSubmit)} noValidate>
            {/* Email */}
            <label htmlFor="email" className="block text-sm mb-1 text-gray-700">
              อีเมล
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
                id="email"
                placeholder="your@email.com"
                autoComplete="email"
                {...register("Email")}
                className="w-full pl-10 pr-3 py-2 rounded-md outline-none"
              />
            </div>
            {errors.Email && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Email.message}
              </p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-5 w-full h-11 inline-flex items-center justify-center rounded-md bg-[#2C3E50] text-white text-sm font-medium hover:bg-[#1a252f] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a252f] disabled:bg-gray-400"
            >
              {isSubmitting ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  กำลังส่งลิงก์...
                </span>
              ) : (
                "ส่งลิงก์รีเซ็ตรหัสผ่าน"
              )}
            </button>

            <div className="text-center mt-4 text-sm">
              นึกออกรหัสผ่านแล้ว?{" "}
              <Link
                to="/login"
                className="text-[#2C3E50] font-medium hover:underline"
              >
                กลับไปเข้าสู่ระบบ
              </Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

export default ForgotPassword;
