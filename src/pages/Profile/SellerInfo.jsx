// src/pages/Profile/Seller/SellerInfo.jsx
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Pencil,
  CircleX,
  Loader2,
  Copy,
  CheckCircle2,
  Image as ImageIcon,
  FileText,
} from "lucide-react";
import Frominput from "@/components/form/Frominput";
import Formuploadimage from "@/components/form/Formuploadimage";
import { useForm } from "react-hook-form";
import { useEffect, useState, useMemo } from "react";
import { updateSeller } from "@/api/user";
import { zodResolver } from "@hookform/resolvers/zod";
import { sellerSchema } from "@/components/schemas/profileSchemas/sellerinfo";
import { useAuth } from "@/context/AuthContext";

// ========== utils ==========
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
const maskThaiID = (id) => {
  if (!id) return "-";
  const digits = String(id).replace(/\D/g, "");
  if (digits.length !== 13) return "-";
  return `${digits[0]}-xxxx-xxxxx-xx-${digits[12]}`;
};

// ========== small UI parts ==========
const DetailRow = ({ label, value, chip }) => {
  const isCopyable = !!value && value !== "-" && !chip;
  return (
    <div className="group flex items-start justify-between gap-3 rounded-md p-2 hover:bg-gray-50 transition">
      <span className="text-[13px] text-gray-500">{label}</span>
      <div className="flex items-center gap-2">
        {chip ? (
          <span
            className={`inline-flex items-center gap-1 px-2 py-0.5 text-xs font-semibold text-white rounded-full ${chip}`}
          >
            <CheckCircle2 className="w-3 h-3 opacity-90" />
            {value ?? "-"}
          </span>
        ) : (
          <span className="text-sm font-medium text-gray-900">
            {value ?? "-"}
          </span>
        )}
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

const SellerInfo = () => {
  const [showModal, setShowModal] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const { authUser: user, revalidateUser } = useAuth();
  const [isSubmittingInfo, setIsSubmittingInfo] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm({ resolver: zodResolver(sellerSchema) });

  // โหลดค่าเดิมเข้าฟอร์ม
  useEffect(() => {
    if (user && user.Seller) {
      reset({
        First_name: user.First_name || "",
        Last_name: user.Last_name || "",
        Phone: user.Phone || "",
        National_ID: user.Seller.National_ID || "",
        Company_Name: user.Seller.Company_Name || "",
        RealEstate_License: user.Seller.RealEstate_License || "",
      });
    }
  }, [user, reset]);

  const onSubmit = async (data) => {
    setIsSubmittingInfo(true);
    try {
      const filteredData = Object.fromEntries(
        Object.entries(data).filter(([_, v]) => v !== undefined && v !== "")
      );
      await updateSeller(filteredData);
      await revalidateUser();
      setShowModal(false);
    } catch (err) {
      console.error("Error updating seller:", err);
      alert("ไม่สามารถบันทึกข้อมูลได้");
    } finally {
      setIsSubmittingInfo(false);
    }
  };

  // รายละเอียดแสดงผล (Buyer ก่อน → Seller)
  const detailRows = useMemo(() => {
    const b = user?.Buyer || {};
    const s = user?.Seller || {};
    const buyerFirst = [
      { label: "เบอร์โทร", value: user?.Phone || "-" },
      { label: "วันเกิด", value: formatDateThai(b?.DateofBirth) },
      { label: "อาชีพ", value: b?.Occupation || b?.Occaaption || "-" },
      { label: "รายได้ต่อเดือน", value: formatBaht(b?.Monthly_Income) },
      { label: "ขนาดครอบครัว", value: b?.Family_Size ?? "-" },
      { label: "จังหวัดที่สนใจ", value: b?.Preferred_Province || "-" },
      { label: "เขต/อำเภอที่สนใจ", value: b?.Preferred_District || "-" },
    ];
    const sellerAfter = [
      { label: "เลขบัตรประชาชน", value: maskThaiID(s?.National_ID) },
      { label: "บริษัท", value: s?.Company_Name || "-" },
      { label: "ใบอนุญาตนายหน้า", value: s?.RealEstate_License || "-" },
      {
        label: "สถานะบัญชี",
        value:
          user?.Status === "APPROVED"
            ? "ยืนยันแล้ว"
            : user?.Status === "PENDING"
            ? "รอดำเนินการ"
            : "ถูกปฏิเสธ",
        chip:
          user?.Status === "APPROVED"
            ? "bg-green-500"
            : user?.Status === "PENDING"
            ? "bg-yellow-500"
            : "bg-red-500",
      },
    ];
    return [...buyerFirst, ...sellerAfter];
  }, [user]);

  return (
    <div className="space-y-6">
      <h2 className="text-xl font-semibold">โปรไฟล์ผู้ขาย</h2>

      <Card className="shadow-md">
        <CardContent className="p-6">
          {/* Header */}
          <div className="flex justify-between items-start mb-6">
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={user?.image || "https://via.placeholder.com/80"}
                  alt="avatar"
                  className="w-20 h-20 rounded-full object-cover border ring-2 ring-[#2c3e50]/20"
                  onError={(e) => {
                    e.currentTarget.src =
                      "https://ui-avatars.com/api/?name=Seller";
                  }}
                  referrerPolicy="no-referrer"
                />
                <span className="absolute -bottom-1 -right-1 inline-flex h-5 items-center justify-center rounded-full bg-white px-2 text-[10px] font-semibold text-[#2c3e50] shadow">
                  Seller
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

            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                className="hover:shadow-sm focus:ring-2 focus:ring-blue-300"
                onClick={() => setShowImageModal(true)}
              >
                แก้ไขรูป
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="hover:shadow-sm focus:ring-2 focus:ring-blue-300"
                onClick={() => setShowModal(true)}
              >
                <Pencil className="w-4 h-4 mr-2" />
                แก้ไขข้อมูล
              </Button>
            </div>
          </div>

          {/* รายละเอียด */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-y-1 gap-x-6 text-sm">
            {detailRows.slice(0, 7).map((row) => (
              <DetailRow key={row.label} label={row.label} value={row.value} />
            ))}

            <div className="col-span-1 sm:col-span-2 my-2">
              <div className="h-px bg-gray-200" />
            </div>

            {detailRows.slice(7).map((row) => (
              <DetailRow
                key={row.label}
                label={row.label}
                value={row.value}
                chip={row.chip}
              />
            ))}
          </div>
        </CardContent>
      </Card>

      {/* =================== MODALS =================== */}

      {/* โมดัลอัปโหลดรูป — สวยงาม + คำอธิบาย + พรีวิวรูปปัจจุบัน */}
      {showImageModal && (
        <ModalShell
          title="อัปโหลดรูปโปรไฟล์"
          description="รองรับไฟล์ JPG/PNG ขนาดแนะนำ 400×400px (ไม่เกิน ~5MB)"
          icon={<ImageIcon className="w-5 h-5" />}
          onClose={() => setShowImageModal(false)}
        >
          <div className="flex items-center gap-4 mb-4">
            <img
              src={user?.image || "https://via.placeholder.com/80"}
              className="w-16 h-16 rounded-full object-cover border"
              alt="current avatar"
              onError={(e) => {
                e.currentTarget.src = "https://ui-avatars.com/api/?name=Seller";
              }}
            />
            <div className="text-xs text-gray-500">
              <div>รูปปัจจุบัน</div>
              <div>เคล็ดลับ: ใช้รูปสว่าง ชัดเจน เห็นใบหน้า</div>
            </div>
          </div>

          <div className="rounded-lg border-2 border-dashed border-gray-300 p-4 mb-4 bg-gray-50">
            {/* คอมโพเนนต์อัปโหลดเดิมของโปรเจกต์ */}
            <Formuploadimage
              onUploadSuccess={async (imageData) => {
                if (!imageData?.url) return alert("ไม่พบ URL รูปภาพ");
                try {
                  await updateSeller({ image: imageData.url });
                  await revalidateUser();
                  setShowImageModal(false);
                } catch (err) {
                  console.error("รูปภาพอัปเดตล้มเหลว:", err);
                  alert("ไม่สามารถบันทึกรูปได้");
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

      {/* โมดัลแก้ไขข้อมูล — จัดกลุ่ม/หัวข้อ/คำอธิบาย + helper text + ปุ่มชัด */}
      {showModal && (
        <ModalShell
          title="แก้ไขข้อมูลผู้ขาย"
          description="ตรวจสอบความถูกต้องก่อนบันทึก โดยเฉพาะเลขบัตรประชาชนและหมายเลขใบอนุญาต"
          icon={<FileText className="w-5 h-5" />}
          onClose={() => setShowModal(false)}
        >
          {/* หัวข้อย่อย */}
          <div className="mb-3">
            <h4 className="text-sm font-semibold text-gray-800 mb-1">
              ข้อมูลส่วนตัว
            </h4>
            <p className="text-xs text-gray-500">
              ชื่อ-นามสกุล และเบอร์โทรจะใช้สำหรับการติดต่อและแสดงในประกาศ
            </p>
          </div>

          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-cols-2 gap-4"
          >
            <Frominput
              label="ชื่อจริง (First Name)"
              name="First_name"
              placeholder="เช่น สมชาย"
              defaultValue={user?.First_name || ""}
              register={register}
              error={errors.First_name?.message}
            />
            <Frominput
              label="นามสกุล (Last Name)"
              name="Last_name"
              placeholder="เช่น ใจดี"
              defaultValue={user?.Last_name || ""}
              register={register}
              error={errors.Last_name?.message}
            />
            <Frominput
              type="tel"
              label="เบอร์โทร"
              name="Phone"
              placeholder="เช่น 0812345678"
              defaultValue={user?.Phone || ""}
              register={register}
              error={errors.Phone?.message}
            />

            <div className="col-span-2 h-px bg-gray-200 my-1" />

            <div className="col-span-2">
              <h4 className="text-sm font-semibold text-gray-800 mb-1">
                ข้อมูลผู้ขาย/บริษัท
              </h4>
              <p className="text-xs text-gray-500">
                กรอกให้ตรงตามเอกสารทางราชการเพื่อความถูกต้อง
              </p>
            </div>

            <Frominput
              label="เลขบัตรประชาชน"
              name="National_ID"
              placeholder="13 หลัก"
              defaultValue={user?.Seller?.National_ID || ""}
              register={register}
              error={errors.National_ID?.message}
            />
            <Frominput
              label="ชื่อบริษัท"
              name="Company_Name"
              placeholder="เช่น บริษัท สมาร์ทโฮม จำกัด"
              defaultValue={user?.Seller?.Company_Name || ""}
              register={register}
              error={errors.Company_Name?.message}
            />
            <Frominput
              label="เลขที่ใบอนุญาตนายหน้า"
              name="RealEstate_License"
              placeholder="เช่น 62-xxxxxxxx"
              defaultValue={user?.Seller?.RealEstate_License || ""}
              register={register}
              error={errors.RealEstate_License?.message}
            />

            <div className="col-span-2 text-xs text-gray-500 -mt-2">
              * ข้อมูลจะถูกตรวจสอบเพื่อยืนยันตัวตน หากมีข้อสงสัย
              ทีมงานอาจติดต่อกลับ
            </div>

            <div className="col-span-2 mt-1 flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                className="hover:shadow-sm"
                onClick={() => setShowModal(false)}
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
                    <Loader2 className="w-4 h-4 animate-spin" /> กำลังบันทึก...
                  </span>
                ) : (
                  "บันทึก"
                )}
              </Button>
            </div>
          </form>
        </ModalShell>
      )}
    </div>
  );
};

export default SellerInfo;
