// src/pages/Profile/Buyer/BuyerInfo.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  CircleX,
  Loader2,
  Copy,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import { useEffect, useState } from "react";
import Frominput from "@/components/form/Frominput";
import { updateprofile } from "@/api/user";
import { useForm } from "react-hook-form";
import Formuploadimage from "@/components/form/Formuploadimage";
import { zodResolver } from "@hookform/resolvers/zod";
import { buyerSchema } from "@/components/schemas/profileSchemas/buyerinfo";
import { useAuth } from "@/context/AuthContext";

const formatDateThai = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  if (isNaN(date)) return "-";
  return date.toLocaleDateString("th-TH", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
};

// ✅ ฟอร์แมตรายได้เป็นเงินบาท (ไม่มีทศนิยม)
const formatBaht = (n) => {
  if (n === null || n === undefined || n === "") return "-";
  const num = Number(n);
  if (Number.isNaN(num)) return "-";
  return num.toLocaleString("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  });
};

// แถวรายละเอียด (label จาง / value ชัด) + ปุ่มคัดลอก
const DetailRow = ({ label, value }) => {
  const isCopyable = !!value && value !== "-";
  return (
    <div className="group flex items-start justify-between gap-3 rounded-md p-2 hover:bg-gray-50 transition">
      <span className="text-[13px] text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-900">
          {value ?? "-"}
        </span>
        {isCopyable && (
          <button
            type="button"
            title="คัดลอก"
            onClick={() => navigator.clipboard?.writeText(String(value))}
            className="opacity-0 group-hover:opacity-100 transition p-1 rounded hover:bg-gray-200"
          >
            <Copy className="w-4 h-4 text-gray-500" />
          </button>
        )}
      </div>
    </div>
  );
};

// เปลือกโมดัลสวย ๆ ใช้ซ้ำได้
const ModalShell = ({ title, description, icon, onClose, children }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center">
    <div
      className="absolute inset-0 bg-black/40 backdrop-blur-sm"
      onClick={onClose}
    />
    <div
      role="dialog"
      aria-modal="true"
      className="relative w-11/12 max-w-xl bg-white rounded-2xl shadow-2xl overflow-hidden"
    >
      <div className="flex items-center gap-3 px-6 py-4 bg-gradient-to-r from-[#2c3e50] via-[#3b4b63] to-[#2c3e50] text-white">
        {icon}
        <div className="flex-1">
          <h3 className="text-lg font-semibold">{title}</h3>
          {description ? (
            <p className="text-xs text-white/80">{description}</p>
          ) : null}
        </div>
        <button
          onClick={onClose}
          aria-label="ปิดหน้าต่าง"
          className="p-1 rounded hover:bg-white/20 focus:outline-none focus:ring-2 focus:ring-white/50"
        >
          <CircleX className="w-5 h-5" />
        </button>
      </div>
      <div className="p-6">{children}</div>
    </div>
  </div>
);

const BuyerInfo = () => {
  const [showModal, setshowModal] = useState(false);
  const [showmodalimage, setshowModalimage] = useState(false);
  const { authUser: user, revalidateUser } = useAuth();
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({
    resolver: zodResolver(buyerSchema),
    defaultValues: {
      DateofBirth: user?.Buyer?.DateofBirth?.split("T")[0] || "",
    },
  });

  useEffect(() => {
    if (user && user.Buyer) {
      reset({
        First_name: user.First_name || "",
        Last_name: user.Last_name || "",
        Phone: user.Phone || "",
        Email: user.Email || "",
        Occupation: user.Buyer.Occupation || "",
        Monthly_Income: user.Buyer.Monthly_Income || "",
        Family_Size: user.Buyer.Family_Size || "",
        Preferred_Province: user.Buyer.Preferred_Province || "",
        Preferred_District: user.Buyer.Preferred_District || "",
        Parking_Needs: user.Buyer.Parking_Needs || "",
        Nearby_Facilities: user.Buyer.Nearby_Facilities || "",
        Lifestyle_Preferences: user.Buyer.Lifestyle_Preferences || "",
        Special_Requirements: user.Buyer.Special_Requirements || "",
        DateofBirth: user?.Buyer?.DateofBirth?.split("T")[0] || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setIsSubmittingInfo(true);
    try {
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(
          ([_, value]) => value !== undefined && value !== ""
        )
      );
      await updateprofile(filteredData);
      await revalidateUser();
      setshowModal(false);
    } catch (err) {
      console.error("Error update user:", err);
      alert("Server Error");
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">โปรไฟล์ผู้ซื้อ</h2>

      <Card className="shadow-md">
        <CardContent className="p-6">
          {/* Header: Avatar + ชื่อ + ปุ่ม */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={user?.image || "https://via.placeholder.com/80"}
                  alt="Profile"
                  className="w-20 h-20 rounded-full object-cover border ring-2 ring-[#2c3e50]/20"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Buyer";
                  }}
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 inline-flex h-5 items-center justify-center rounded-full bg-white px-2 text-[10px] font-semibold text-[#2c3e50] shadow">
                  Buyer
                </span>
              </div>

              <div>
                <p className="text-xl font-bold">
                  {user?.First_name} {user?.Last_name}
                </p>
                <div className="flex items-center gap-2">
                  <p className="text-sm text-gray-600">{user?.Email || "-"}</p>
                  {!!user?.Email && (
                    <button
                      type="button"
                      title="คัดลอกอีเมล"
                      onClick={() =>
                        navigator.clipboard?.writeText(String(user?.Email))
                      }
                      className="p-1 rounded hover:bg-gray-200"
                    >
                      <Copy className="w-4 h-4 text-gray-500" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ปุ่มแก้ไข */}
            <div className="flex justify-center items-center space-x-2">
              <Button
                className="cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-blue-300"
                variant="outline"
                size="sm"
                onClick={() => setshowModalimage(true)}
              >
                แก้ไขรูป
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setshowModal(true)}
                className="cursor-pointer hover:shadow-sm focus:ring-2 focus:ring-blue-300"
              >
                <Pencil className="w-4 h-4 mr-2" />
                แก้ไขข้อมูล
              </Button>
            </div>
          </div>

          {/* โมดัลอัปโหลดรูป — เพิ่มหัวข้อ/คำอธิบาย/พรีวิวรูป */}
          {showmodalimage && (
            <ModalShell
              title="อัปโหลดรูปโปรไฟล์"
              description="รองรับไฟล์ JPG/PNG ขนาดแนะนำ 400×400px (ไม่เกิน ~5MB)"
              icon={<ImageIcon className="w-5 h-5" />}
              onClose={() => setshowModalimage(false)}
            >
              <div className="flex items-center gap-4 mb-4">
                <img
                  src={user?.image || "https://via.placeholder.com/80"}
                  className="w-16 h-16 rounded-full object-cover border"
                  alt="current avatar"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Buyer";
                  }}
                />
                <div className="text-xs text-gray-500">
                  <div>รูปปัจจุบัน</div>
                  <div>เคล็ดลับ: ใช้รูปสว่าง ชัดเจน เห็นใบหน้า</div>
                </div>
              </div>

              <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 mb-4 bg-gray-50">
                <Formuploadimage
                  onUploadSuccess={async (imageData) => {
                    if (!imageData?.url) return alert("ไม่พบ URL รูปภาพ");
                    try {
                      await updateprofile({ image: imageData.url });
                      await revalidateUser();
                      setshowModalimage(false);
                    } catch (err) {
                      console.error("อัปเดตรูปภาพล้มเหลว:", err);
                      alert("ไม่สามารถอัปเดตรูปได้");
                    }
                  }}
                />
              </div>

              <div className="text-xs text-gray-500">
                * การเปลี่ยนรูปจะมีผลทันทีหลังบันทึก
                และอาจใช้เวลาสักครู่ในการรีเฟรชรูปใหม่
              </div>
            </ModalShell>
          )}

          {/* โมดัลแก้ไขข้อมูล — จัดกลุ่ม/หัวข้อ/placeholder/helper text */}
          {showModal && (
            <ModalShell
              title="แก้ไขข้อมูลผู้ซื้อ"
              description="กรอกข้อมูลให้ครบถ้วนเพื่อช่วยให้ค้นหาอสังหาได้ตรงใจมากขึ้น"
              icon={<FileText className="w-5 h-5" />}
              onClose={() => setshowModal(false)}
            >
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">
                    ข้อมูลส่วนตัว
                  </h4>
                  <p className="text-xs text-gray-500">
                    ชื่อ-นามสกุล, เบอร์โทร และอีเมล ใช้สำหรับติดต่อ
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-3">
                  <div className="col-span-2">
                    <label className="text-xs text-gray-600 mb-1 block">
                      วันเกิด
                    </label>
                    <input
                      type="date"
                      value={
                        watch("DateofBirth") ||
                        user?.Buyer?.DateofBirth?.split("T")[0] ||
                        ""
                      }
                      {...register("DateofBirth")}
                      className="input w-full h-10 border p-2 rounded-xl"
                    />
                    {errors.DateofBirth && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.DateofBirth.message}
                      </p>
                    )}
                  </div>

                  <Frominput
                    label="First Name"
                    name="First_name"
                    placeholder="เช่น สมชาย"
                    defaultValue={user?.First_name || ""}
                    register={register}
                    error={errors.First_name?.message}
                  />
                  <Frominput
                    label="Last Name"
                    name="Last_name"
                    placeholder="เช่น ใจดี"
                    defaultValue={user?.Last_name || ""}
                    register={register}
                    error={errors.Last_name?.message}
                  />
                  <Frominput
                    type="tel"
                    label="Phone Number"
                    name="Phone"
                    placeholder="เช่น 0812345678"
                    defaultValue={user?.Phone || ""}
                    register={register}
                    error={errors.Phone?.message}
                  />
                  <Frominput
                    label="Email"
                    name="Email"
                    placeholder="เช่น you@example.com"
                    defaultValue={user?.Email || ""}
                    register={register}
                    error={errors.Email?.message}
                  />
                </div>

                <div className="h-px bg-gray-200 my-3" />

                <div className="mb-3">
                  <h4 className="text-sm font-semibold text-gray-800 mb-1">
                    ความต้องการ/ไลฟ์สไตล์
                  </h4>
                  <p className="text-xs text-gray-500">
                    ข้อมูลนี้ช่วยแนะนำประกาศที่เหมาะกับคุณ
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Frominput
                    label="อาชีพ"
                    name="Occupation"
                    placeholder="เช่น พนักงานบริษัท"
                    defaultValue={user?.Buyer?.Occupation || ""}
                    register={register}
                    error={errors.Occupation?.message}
                  />
                  <Frominput
                    type="number"
                    label="Monthly Income"
                    name="Monthly_Income"
                    placeholder="เช่น 45000"
                    defaultValue={user?.Buyer?.Monthly_Income || ""}
                    register={register}
                    error={errors.Monthly_Income?.message}
                  />
                  <Frominput
                    type="number"
                    label="Family Size"
                    name="Family_Size"
                    placeholder="จำนวนสมาชิกในครอบครัว"
                    defaultValue={user?.Buyer?.Family_Size || ""}
                    register={register}
                    error={errors.Family_Size?.message}
                  />

                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">
                      Parking Needs
                    </label>
                    <select
                      className="input w-full h-10 border p-2 rounded-xl"
                      {...register("Parking_Needs")}
                    >
                      <option value="">Select Parking Needs</option>
                      <option value="oneCar">1 Car</option>
                      <option value="twoCars">2 Cars</option>
                      <option value="Not_required">Not Required</option>
                    </select>
                    {errors.Parking_Needs && (
                      <p className="text-red-500 text-xs mt-1">
                        {errors.Parking_Needs?.message}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">
                      Nearby Facilities
                    </label>
                    <select
                      className="input w-full h-10 border p-2 rounded-xl"
                      {...register("Nearby_Facilities")}
                    >
                      <option value="">Nearby Facilities</option>
                      <option value="School">School</option>
                      <option value="Hospital">Hospital</option>
                      <option value="Mall_Market">Mall/Market</option>
                      <option value="Park_Nature">Park</option>
                    </select>
                  </div>

                  <div className="flex flex-col">
                    <label className="text-xs text-gray-600 mb-1">
                      Lifestyle Preferences
                    </label>
                    <select
                      className="input w-full h-10 border p-2 rounded-xl"
                      {...register("Lifestyle_Preferences")}
                    >
                      <option value="">Lifestyle Preferences</option>
                      <option value="Work_from_Home">Work from Home</option>
                      <option value="Have_Pets">Have Pets</option>
                      <option value="Need_a_Home_Office">Need Office</option>
                      <option value="Like_Gardening">Like Gardening</option>
                    </select>
                  </div>
                </div>

                <label className="text-xs text-gray-600 mb-1 block">
                  Special Requirements
                </label>
                <textarea
                  {...register("Special_Requirements")}
                  placeholder="ระบุความต้องการพิเศษ เช่น ต้องการบ้านใกล้รถไฟฟ้า/โรงเรียน ฯลฯ"
                  className="input w-full p-3 rounded-xl border-2"
                />

                <div className="mt-4 flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    className="hover:shadow-sm"
                    onClick={() => setshowModal(false)}
                    disabled={isSubmittingInfo || isSubmitting}
                  >
                    ยกเลิก
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#2C3E50] hover:bg-[#1a252f]"
                    disabled={isSubmittingInfo || isSubmitting || !isDirty}
                  >
                    {isSubmittingInfo || isSubmitting ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" />{" "}
                        กำลังบันทึก...
                      </span>
                    ) : (
                      "บันทึก"
                    )}
                  </Button>
                </div>
              </form>
            </ModalShell>
          )}

          {/* รายละเอียด (โชว์แบบอ่านง่าย + คัดลอกเร็ว) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
            <DetailRow label="เบอร์โทร" value={user?.Phone || "-"} />
            <DetailRow
              label="วันเกิด"
              value={formatDateThai(user?.Buyer?.DateofBirth)}
            />
            <DetailRow label="อาชีพ" value={user?.Buyer?.Occupation || "-"} />
            <DetailRow
              label="รายได้"
              value={formatBaht(user?.Buyer?.Monthly_Income)}
            />
            <DetailRow
              label="ขนาดครอบครัว"
              value={user?.Buyer?.Family_Size ?? "-"}
            />
            <DetailRow
              label="จังหวัดที่สนใจ"
              value={user?.Buyer?.Preferred_Province || "-"}
            />
            <DetailRow
              label="เขตที่สนใจ"
              value={user?.Buyer?.Preferred_District || "-"}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BuyerInfo;
