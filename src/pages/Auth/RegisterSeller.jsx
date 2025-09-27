// src/pages/Profile/Seller/RegisterSeller.jsx
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { registerSeller } from "@/api/auth";
import { useAuth } from "@/context/AuthContext";
import { Loader2, Image as ImageIcon } from "lucide-react";
import Logo from "@/components/Logo";
import { registerSellerSchema } from "@/components/schemas/authSchemas";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

const RegisterSeller = () => {
  const { authUser, revalidateUser } = useAuth();
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(registerSellerSchema),
  });

  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // state สำหรับไฟล์บัตรประชาชน
  const [nationalIdFile, setNationalIdFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const [fileError, setFileError] = useState(null);

  useEffect(() => {
    if (authUser && authUser.userType === "Seller") {
      navigate("/seller");
    }
  }, [authUser, navigate]);

  // cleanup object URL
  useEffect(() => {
    return () => {
      if (filePreview) URL.revokeObjectURL(filePreview);
    };
  }, [filePreview]);

  const handleFileChange = (e) => {
    const f = e.target.files?.[0];
    setFileError(null);
    if (!f) {
      setNationalIdFile(null);
      setFilePreview(null);
      return;
    }
    if (!f.type.startsWith("image/")) {
      setFileError("โปรดเลือกไฟล์รูปภาพ (JPG/PNG)");
      setNationalIdFile(null);
      setFilePreview(null);
      return;
    }
    if (f.size > MAX_FILE_SIZE) {
      setFileError("ขนาดไฟล์ต้องไม่เกิน 5MB");
      setNationalIdFile(null);
      setFilePreview(null);
      return;
    }
    const url = URL.createObjectURL(f);
    setNationalIdFile(f);
    setFilePreview(url);
  };

  const onSubmit = async (data) => {
    setServerError(null);
    setSuccessMessage(null);

    // ต้องมีไฟล์บัตรประชาชน
    if (!nationalIdFile) {
      setFileError("กรุณาอัปโหลดรูปภาพบัตรประชาชน");
      return;
    }

    try {
      // สร้าง FormData ตามชื่อ field ที่ backend รอรับ
      const fd = new FormData();
      fd.append("National_ID", (data.National_ID || "").replace(/\D/g, ""));
      if (data.Company_Name)
        fd.append("Company_Name", data.Company_Name.trim());
      if (data.RealEstate_License)
        fd.append("RealEstate_License", data.RealEstate_License.trim());
      fd.append("nationalIdImage", nationalIdFile); // <<< สำคัญ: ต้องชื่อ field นี้

      const response = await registerSeller(fd); // ฟังก์ชันนี้ต้องส่ง multipart/form-data
      setSuccessMessage(response?.message || "สมัครเป็นผู้ขายสำเร็จ");
      await revalidateUser();
      setTimeout(() => navigate("/seller"), 1200);
    } catch (err) {
      console.error("Caught Error on Frontend:", err);
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
            กรอกข้อมูลและอัปโหลดรูปบัตรประชาชนเพื่ออัปเกรดบัญชีของคุณเป็นผู้ขาย
          </p>
        </div>

        {serverError && (
          <div className="mb-5 p-3 text-red-800 bg-red-100 border border-red-300 rounded-md">
            {serverError}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* National ID */}
          <div>
            <label
              htmlFor="National_ID"
              className="block text-sm font-medium text-gray-700"
            >
              บัตรประจำตัวประชาชน <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="National_ID"
              inputMode="numeric"
              pattern="[0-9]*"
              maxLength={13}
              {...register("National_ID")}
              onInput={(e) => {
                e.currentTarget.value = e.currentTarget.value
                  .replace(/\D/g, "")
                  .slice(0, 13);
              }}
              className={`mt-1 block w-full px-3 py-2 border ${
                errors.National_ID ? "border-red-500" : "border-gray-300"
              } rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-200 focus:border-gray-400`}
              placeholder="กรอกเลข 13 หลัก"
            />
            {errors.National_ID ? (
              <p className="mt-1 text-sm text-red-600">
                {errors.National_ID.message}
              </p>
            ) : (
              <p className="mt-1 text-xs text-gray-500">
                ต้องเป็นตัวเลข 13 หลัก
              </p>
            )}
          </div>

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

          {/* Upload National ID Image */}
          <div>
            <label className="block text-sm font-medium text-gray-700">
              รูปภาพบัตรประชาชน <span className="text-red-500">*</span>
            </label>

            <div className="mt-1 rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 p-4">
              <div className="flex items-center gap-4">
                <div className="w-20 h-20 rounded-md border bg-white overflow-hidden flex items-center justify-center">
                  {filePreview ? (
                    <img
                      src={filePreview}
                      alt="Preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <ImageIcon className="w-8 h-8 text-gray-400" />
                  )}
                </div>
                <div className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="block w-full text-sm text-gray-700 file:mr-4 file:rounded-md file:border-0 file:bg-[#2C3E50] file:px-4 file:py-2 file:text-sm file:font-semibold file:text-white hover:file:bg-[#1a252f] cursor-pointer"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    รองรับ JPG/PNG ขนาดไม่เกิน 5MB
                  </p>
                  {fileError && (
                    <p className="mt-1 text-sm text-red-600">{fileError}</p>
                  )}
                </div>
              </div>
            </div>
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
