import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/components/schemas/authSchemas";
import { login } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { useEffect, useState } from "react";
import { Loader2, Mail, Lock, Eye, EyeOff } from "lucide-react";
import Logo from "@/components/Logo";

const Login = () => {
  const navigate = useNavigate();
  const { authUser, revalidateUser } = useAuth();
  const [serverError, setServerError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(loginSchema),
  });

  useEffect(() => {
    if (authUser) {
      if (authUser.userType === "Seller") navigate("/seller");
      else if (authUser.userType === "Buyer") navigate("/buyer");
      else if (authUser.userType === "Admin") window.location.href = "http://localhost:8200/admin";
    }
  }, [authUser, navigate]);

  const onSubmit = async (formData) => {
    setServerError("");
    setIsSubmitting(true);
    try {
      await login(formData);
      await revalidateUser();
    } catch (err) {
      setServerError(
        err?.response?.data?.message || "เข้าสู่ระบบไม่สำเร็จ กรุณาลองใหม่"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-5xl bg-white rounded-2xl shadow-[0_20px_60px_rgba(0,0,0,0.15)] ring-1 ring-gray-200 overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-2">
          {/* รูปด้านซ้าย (แสดงเฉพาะ md ขึ้นไป) */}
          <div className="hidden md:flex relative">
            <img
              src="https://i.pinimg.com/1200x/85/70/b6/8570b62602cb72aebf9b7d5cdb562f99.jpg"
              alt="บ้านสไตล์โมเดิร์น"
              className="w-full h-[700px] object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-black/10" />
          </div>

          {/* ฟอร์มด้านขวา */}
          <div className="p-8 md:p-10 flex flex-col justify-center">
            <div className="flex flex-col items-center mb-6">
              <Logo />
              <h1 className="text-2xl md:text-3xl font-semibold text-[#2C3E50] mt-2 text-center">
                Yuu Yenn Property
              </h1>
              <p className="text-gray-500 text-sm mt-1 text-center">
                เข้าสู่ระบบเพื่อค้นหาอสังหาฯ ที่ใช่สำหรับคุณ
              </p>
            </div>

            {serverError && (
              <div className="mb-4 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md text-sm text-center">
                {serverError}
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} noValidate>
              {/* Email */}
              <div className="mb-4">
                <label
                  htmlFor="email"
                  className="block text-sm mb-1 text-gray-700"
                >
                  อีเมล
                </label>
                <div
                  className={`relative rounded-md border ${errors.Email ? "border-red-500" : "border-gray-300"
                    } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
                >
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Mail className="w-4 h-4 text-gray-400" />
                  </span>
                  <input
                    {...register("Email")}
                    type="email"
                    id="email"
                    placeholder="your@email.com"
                    className="w-full pl-10 pr-3 py-2 rounded-md outline-none"
                    autoComplete="email"
                  />
                </div>
                {errors.Email ? (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.Email.message}
                  </p>
                ) : (
                  <p className="text-xs text-gray-500 mt-1">
                    ใช้สำหรับเข้าสู่ระบบและยืนยันตัวตน
                  </p>
                )}
              </div>

              {/* Password */}
              <div className="mb-2">
                <label
                  htmlFor="password"
                  className="block text-sm mb-1 text-gray-700"
                >
                  รหัสผ่าน
                </label>
                <div
                  className={`relative rounded-md border ${errors.Password ? "border-red-500" : "border-gray-300"
                    } focus-within:ring-2 focus-within:ring-gray-200 focus-within:border-gray-400`}
                >
                  <span className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Lock className="w-4 h-4 text-gray-400" />
                  </span>
                  <input
                    {...register("Password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2 rounded-md outline-none"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    aria-label={showPassword ? "ซ่อนรหัสผ่าน" : "แสดงรหัสผ่าน"}
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? (
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

              {/* ลิงก์ลืมรหัสผ่าน */}
              <div className="text-right mb-5">
                <button
                  type="button"
                  onClick={() => navigate("/forgot")}
                  className="text-sm text-gray-600 hover:text-[#2C3E50] underline underline-offset-4"
                >
                  ลืมรหัสผ่าน?
                </button>
              </div>

              {/* ปุ่ม Login */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full h-11 inline-flex items-center justify-center rounded-md bg-[#2C3E50] text-white text-sm font-medium hover:bg-[#1a252f] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a252f] disabled:bg-gray-400"
              >
                {isSubmitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    กำลังเข้าสู่ระบบ...
                  </span>
                ) : (
                  "เข้าสู่ระบบ"
                )}
              </button>

              {/* สมัครสมาชิก */}
              <div className="text-center mt-5 text-sm">
                ยังไม่มีบัญชี?{" "}
                <Link
                  to="/register"
                  className="text-[#2C3E50] font-medium hover:underline"
                >
                  สมัครสมาชิก
                </Link>
              </div>
            </form>

            {/* เส้นคั่นเล็ก ๆ + ข้อความ */}
            <div className="mt-6">
              <div className="h-px w-full bg-gray-200" />
              <p className="text-xs text-gray-500 text-center mt-3">
                การเข้าสู่ระบบหมายถึงคุณยอมรับ{" "}
                <span className="underline underline-offset-2">
                  ข้อตกลงการใช้งาน
                </span>{" "}
                และ{" "}
                <span className="underline underline-offset-2">
                  นโยบายความเป็นส่วนตัว
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
