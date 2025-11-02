// src/pages/Profile/Seller/RegisterSeller.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSeller } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { Loader2 } from "lucide-react";
import Logo from "@/components/Logo";
import { registerSellerSchema } from "@/components/schemas/authSchemas";

const RegisterSeller = () => {
  const { authUser, revalidateUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSellerSchema),
    defaultValues: {
      Company_Name: "",
      RealEstate_License: "",
      StartTime: "",
      // ❌ ไม่มี National_ID อีกต่อไป
    },
  });

  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (authUser && authUser.userType === "Seller") {
      navigate("/seller");
    }
  }, [authUser, navigate]);

  const onSubmit = async (data) => {
    setServerError(null);
    setSuccessMessage(null);
    try {
      // ส่งเป็น JSON ปกติ (ไม่ต้อง multipart)
      const response = await registerSeller(data);
      setSuccessMessage(response?.message || "สมัครเป็นผู้ขายสำเร็จ");
      await revalidateUser();
      setTimeout(() => navigate("/seller"), 1000);
    } catch (err) {
      console.error("RegisterSeller error:", err);
      setServerError(
        err?.response?.data?.message || "เกิดข้อผิดพลาดที่ไม่คาดคิด"
      );
    }
  };

  if (successMessage) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4">
        <div className="w-full max-w-lg bg-white border border-green-300 rounded-2xl shadow-2xl ring-1 ring-green-200 p-8 text-center">
          <Logo />
          <h3 className="text-2xl font-semibold mt-2 text-green-700">
            สมัครสำเร็จ!
          </h3>
          <p className="mt-2 text-green-600">{successMessage}</p>
          <p className="text-sm text-green-600 mt-1">
            กำลังนำคุณไปยังหน้าผู้ขาย...
          </p>
          <Loader2 className="w-6 h-6 animate-spin mx-auto mt-4 text-green-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-xl bg-white border border-gray-300 rounded-2xl shadow-2xl ring-1 ring-gray-200 p-6 md:p-8">
        <div className="flex flex-col items-center mb-6">
          <Logo />
          <h2 className="text-2xl font-bold text-[#2C3E50] mt-2">
            สมัครเป็นผู้ขาย
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            กรอกข้อมูลเพื่ออัปเกรดบัญชีของคุณเป็นผู้ขาย
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Company Name (optional) */}
          <div>
            <label
              htmlFor="Company_Name"
              className="block text-sm font-medium text-gray-700"
            >
              ชื่อบริษัท (ถ้ามี)
            </label>
            <input
              type="text"
              id="Company_Name"
              {...register("Company_Name")}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.Company_Name ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400`}
              placeholder="เช่น บริษัท ยูยุเอน พร็อพเพอร์ตี้ จำกัด"
            />
            {errors.Company_Name && (
              <p className="mt-1 text-sm text-red-600">
                {errors.Company_Name.message}
              </p>
            )}
          </div>

          {/* Real Estate License (optional) */}
          <div>
            <label
              htmlFor="RealEstate_License"
              className="block text-sm font-medium text-gray-700"
            >
              เลขใบอนุญาตนายหน้า (ถ้ามี)
            </label>
            <input
              type="text"
              id="RealEstate_License"
              {...register("RealEstate_License")}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.RealEstate_License ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400`}
              placeholder="เช่น 1-2345-67"
            />
            {errors.RealEstate_License && (
              <p className="mt-1 text-sm text-red-600">
                {errors.RealEstate_License.message}
              </p>
            )}
          </div>

          {/* Start time (optional) */}
          <div>
            <label
              htmlFor="StartTime"
              className="block text-sm font-medium text-gray-700"
            >
              วันที่เริ่มเป็นผู้ขาย (ถ้ามี)
            </label>
            <input
              type="datetime-local"
              id="StartTime"
              {...register("StartTime")}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400"
            />
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full flex justify-center items-center h-11 px-4 rounded-md text-white text-sm font-medium bg-[#2C3E50] hover:bg-[#1a252f] transition focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#1a252f] disabled:bg-gray-400"
          >
            {isSubmitting ? (
              <Loader2 className="w-6 h-6 animate-spin" />
            ) : (
              "สมัครเป็นผู้ขาย"
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterSeller;
