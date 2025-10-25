// src/components/PostComponents/EditPostDialog.jsx
import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { apiClient } from "@/api/authconfig";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, Image as ImageIcon, CheckCircle } from "lucide-react";

// ---------- ใช้ zod schemas เดิม ----------
import { postTitleSchema } from "../schemas/postSchemas/postTitleSchema";
import { postLocationSchema } from "../schemas/postSchemas/postLocationSchema";
import { postDetailSchema } from "../schemas/postSchemas/postDetailSchema";
import { postPriceSchema } from "../schemas/postSchemas/postPriceSchema";
import { postInformSchema } from "../schemas/postSchemas/postInformSchema";

// ✅ ขยาย schema ราคา (เวอร์ชันย่อที่ใช้ใน Dialog นี้)
const postPriceExtended = postPriceSchema.safeExtend({
  Sell_Rent: z.enum(["SALE", "RENT"]).optional(),
// ... (fields อื่นๆ) ...
  Deposit_Amount: z
    .union([z.number().min(0), z.string()])
    .optional()
    .nullable(),
  Interest: z
    .union([z.number().min(0), z.string()])
    .optional()
    .nullable(),
});

const editPostSchema = postTitleSchema
  .merge(postLocationSchema)
  .merge(postDetailSchema)
  .merge(postPriceExtended)
  .merge(
    postInformSchema.pick({
      // ✅ ใช้เฉพาะช่องที่คงไว้ในหน้าแก้ไข
      Phone: true,
      Link_line: true,
      Link_facbook: true,
    })
  );

// ---------- Utils ----------
const formatBaht = (n) =>
  Number.isFinite(Number(n)) ? Number(n).toLocaleString() : "-";
const toNum = (v) =>
  v === "" || v === undefined || v === null ? undefined : Number(v);

export default function EditPostDialog({
  open,
  onOpenChange,
  postId,
  initialPost, // รับโพสต์ทั้งก้อนจาก SellerPost
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("title");
  const [serverData, setServerData] = useState(null);
  const [categories, setCategories] = useState([]);
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);

  const form = useForm({
    resolver: zodResolver(editPostSchema),
    defaultValues: {
      // title
      Property_Name: "",
      Description: "",
      // location
      Address: "",
      Province: "",
      District: "",
      Subdistrict: "",
      PostalCode: "",
      // detail (แบบย่อ)
      categoryId: "",
      Usable_Area: "",
      Land_Size: "",
      Bedrooms: "",
      Bathroom: "",
      Parking_Space: "",
      // price (เวอร์ชันย่อ)
      Sell_Rent: "SALE",
      Price: "",
      Deposit_Amount: "",
      Interest: "",
      // inform — คงไว้เฉพาะ 3 ช่อง
      Phone: "",
      Link_line: "",
      Link_facbook: "",
    },
    mode: "onChange",
  });

  const {
    register,
    handleSubmit,
    reset,
    watch,
    trigger,
    setValue,
    formState: { errors },
  } = form;

  const tabOrder = [
    "title",
    "location",
    "detail",
    "price",
    "inform",
    "media",
    "confirm",
  ];
  const currentStep = useMemo(() => tabOrder.indexOf(activeTab), [activeTab]);

  // โหลดหมวดหมู่ตอนเปิด
  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const catRes = await apiClient.get("/allcategory");
        setCategories(catRes.data || []);
      } catch {
        // ไม่ critical
      }
    })();
  }, [open]);

  // เติมค่าเริ่มต้นจาก initialPost (ไม่ fetch backend)
  useEffect(() => {
    if (!open) return;
    setLoadingData(true);
    const d = initialPost || {};
    setServerData(d);

    // รองรับสะกด facebook เก่า
    const fbLink = d?.Link_facbook ?? d?.Link_facebook ?? "";

    reset({
      // title
      Property_Name: d?.Property_Name ?? "",
      Description: d?.Description ?? "",
      // location
      Address: d?.Address ?? "",
      Province: d?.Province ?? "",
      District: d?.District ?? "",
      Subdistrict: d?.Subdistrict ?? "",
      PostalCode: d?.PostalCode ?? "",
      // detail
      categoryId: d?.categoryId ?? "",
      Usable_Area: d?.Usable_Area ?? "",
      Land_Size: d?.Land_Size ?? "",
      Bedrooms: d?.Bedrooms ?? "",
      Bathroom: d?.Bathroom ?? "",
      Parking_Space: d?.Parking_Space ?? "",
      // price
      Sell_Rent: d?.Sell_Rent ?? "SALE",
      Price: d?.Price ?? "",
      Deposit_Amount: d?.Deposit_Amount ?? "",
      Interest: d?.Interest ?? "",
      // inform — เหลือ 3 ช่อง
      Phone: d?.Phone ?? "",
      Link_line: d?.Link_line ?? "",
      Link_facbook: fbLink,
    });

    setNewImages([]);
    setNewVideos([]);
    setActiveTab("title");
    setLoadingData(false);
  }, [open, initialPost, reset]);

  // validate รายแท็บ
  const fieldsPerTab = {
    title: ["Property_Name", "Description"],
    location: ["Address", "Province", "District", "Subdistrict", "PostalCode"],
    detail: [
      "categoryId",
      "Usable_Area",
      "Land_Size",
      "Bedrooms",
      "Bathroom",
      "Parking_Space",
    ],
    price: ["Sell_Rent", "Price", "Deposit_Amount", "Interest"],
    // ✅ inform เหลือเฉพาะ 3 ฟิลด์
    inform: ["Phone", "Link_line", "Link_facbook"],
    media: [],
    confirm: [],
  };

  async function goNext() {
    const idx = tabOrder.indexOf(activeTab);
    if (idx === -1 || idx >= tabOrder.length - 1) return;
    const ok = await trigger(fieldsPerTab[activeTab]);
    if (!ok) return;
    setActiveTab(tabOrder[idx + 1]);
  }
  function goPrev() {
    const idx = tabOrder.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabOrder[idx - 1]);
  }

  // ---------- ค่าที่ใช้ในแท็บราคา ----------
  const sellRentLocked = watch("Sell_Rent") || "SALE";

  // submit (PATCH partial; ถ้ามีไฟล์ -> multipart)
  const onSubmit = async (values) => {
    if (!postId) return;
    try {
      setLoading(true);
      const hasFiles = newImages.length > 0 || newVideos.length > 0;

      // แปลงตัวเลขก่อนส่ง + ล็อกประเภท
      const payload = {
        ...values,
        Sell_Rent: sellRentLocked,
        Price: toNum(values.Price),
        Deposit_Amount: toNum(values.Deposit_Amount),
        Interest: toNum(values.Interest),
        // ส่งซ้ำ key เดิมเพื่อรองรับ backend เก่า
        Link_facebook: values.Link_facbook ?? values.Link_facebook,
      };

      if (hasFiles) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          if (Array.isArray(v)) {
            fd.append(k, JSON.stringify(v));
          } else if (v !== undefined && v !== null) {
            fd.append(k, v);
          }
        });
        newImages.forEach((f) => fd.append("images", f));
        newVideos.forEach((f) => fd.append("videos", f));

        await apiClient.patch(`/propertypost/${postId}`, fd, {
          headers: { "Content-Type": "multipart/form-data" },
        });
      } else {
        await apiClient.patch(`/propertypost/${postId}`, payload);
      }

      if (typeof onSaved === "function") await onSaved();
      onOpenChange(false);
    } catch (err) {
      alert(err?.response?.data?.message || "บันทึกไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  // ---------- UI ----------
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* ✅ ขยายความกว้างโมดัลจาก max-w-5xl → max-w-6xl */}
      <DialogContent className="max-w-6xl p-0 md:h-[85vh] flex flex-col overflow-hidden">
        {/* Header */}
        <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0">
          <DialogTitle className="text-2xl">แก้ไขประกาศ</DialogTitle>
          <DialogDescription className="text-gray-600">
            แก้ไขข้อมูลแบบขั้นตอนเหมือนหน้าโพสต์ประกาศ
            เพื่อให้ครบถ้วนและเป็นระเบียบ
          </DialogDescription>
        </DialogHeader>

        {/* ฟอร์มเป็นคอลัมน์ + ให้พื้นที่เลื่อน */}
        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex-1 min-h-0 flex flex-col"
        >
          <Tabs
            value={activeTab}
            onValueChange={setActiveTab}
            className="flex-1 min-h-0 flex flex-col"
          >
            {/* แถบ Tab ติดหัว */}
            <div className="sticky top-0 z-10 -mx-6 px-6 py-2 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-b">
              <TabsList className="grid grid-cols-7 gap-2 w-full bg-[#2c3e50]/10">
                <TabsTrigger value="title">หัวข้อ</TabsTrigger>
                <TabsTrigger value="location">ที่ตั้ง</TabsTrigger>
                <TabsTrigger value="detail">รายละเอียด</TabsTrigger>
                <TabsTrigger value="price">ราคา</TabsTrigger>
                <TabsTrigger value="inform">ข้อมูลผู้ขาย</TabsTrigger>
                <TabsTrigger value="media">อัปโหลดรูป</TabsTrigger>
                <TabsTrigger value="confirm">ยืนยัน</TabsTrigger>
              </TabsList>
            </div>

            {/* เนื้อหาเลื่อนในกรอบนี้ */}
            <div className="flex-1 min-h-0 overflow-y-auto pr-1 pt-4">
              {loadingData ? (
                <div className="flex items-center justify-center py-12 text-gray-500">
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  กำลังโหลดข้อมูล...
                </div>
              ) : (
                <>
                  {/* 1) หัวข้อ */}
                  <TabsContent value="title" className="mt-0">
                    <Card className="shadow-sm">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">
                          หัวข้อประกาศ & รายละเอียด
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block mb-1">หัวข้อประกาศ</label>
                          <Input
                            placeholder="เช่น บ้านเดี่ยว 2 ชั้น ใกล้ BTS"
                            {...register("Property_Name")}
                          />
                          {errors.Property_Name && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.Property_Name.message}
                            </p>
                          )}
                        </div>
                        <div className="md:col-span-2">
                          <label className="block mb-1">รายละเอียด</label>
                          <Textarea
                            rows={5}
                            placeholder="สรุปรายละเอียด จุดเด่น สภาพบ้าน"
                            {...register("Description")}
                          />
                          {errors.Description && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.Description.message}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 2) ที่ตั้ง */}
                  <TabsContent value="location" className="mt-0">
                    <Card className="shadow-sm">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">ที่ตั้งทรัพย์</CardTitle>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="md:col-span-2">
                          <label className="block mb-1">ที่อยู่</label>
                          <Input
                            placeholder="เลขที่/ซอย/ถนน"
                            {...register("Address")}
                          />
                          {errors.Address && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.Address.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1">จังหวัด</label>
                          <Input
                            placeholder="เช่น นครปฐม"
                            {...register("Province")}
                          />
                          {errors.Province && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.Province.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1">อำเภอ/เขต</label>
                          <Input
                            placeholder="เช่น เมืองนครปฐม"
                            {...register("District")}
                          />
                          {errors.District && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.District.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1">ตำบล/แขวง</label>
                          <Input
                            placeholder="เช่น พระปฐมเจดีย์"
                            {...register("Subdistrict")}
                          />
                          {errors.Subdistrict && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.Subdistrict.message}
                            </p>
                          )}
                        </div>
                        <div>
                          <label className="block mb-1">รหัสไปรษณีย์</label>
                          <Input
                            placeholder="เช่น 73000"
                            {...register("PostalCode")}
                          />
                          {errors.PostalCode && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.PostalCode.message}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 3) รายละเอียด (แบบย่อ) */}
                  <TabsContent value="detail" className="mt-0">
                    <Card className="shadow-sm">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">
                          รายละเอียดทรัพย์ (แบบย่อ)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-5">
                        {/* หมวดหมู่ */}
                        <div className="space-y-2">
                          <label className="block">ประเภททรัพย์สิน</label>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                            {categories.map((c) => {
                              const active =
                                String(watch("categoryId")) === String(c.id);
                              return (
                                <Button
                                  key={c.id}
                                  type="button"
                                  variant={active ? "default" : "outline"}
                                  onClick={() =>
                                    setValue("categoryId", c.id, {
                                      shouldDirty: true,
                                      shouldValidate: true,
                                    })
                                  }
                                  aria-pressed={active}
                                  className="h-10"
                                >
                                  {c.name}
                                </Button>
                              );
                            })}
                          </div>
                          {errors.categoryId && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.categoryId.message}
                            </p>
                          )}
                          <p className="text-xs text-muted-foreground mt-1">
                            *การเปลี่ยนหมวดหมู่อาจกระทบการค้นหา/การจัดกลุ่มประกาศ
                          </p>
                        </div>

                        {/* พื้นที่ใช้สอย / ที่ดิน */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1">
                              พื้นที่ใช้สอย (ตร.ม.)
                            </label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="เช่น 120"
                              {...register("Usable_Area")}
                            />
                            {errors.Usable_Area && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.Usable_Area.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block mb-1">
                              ขนาดที่ดิน (ตร.วา)
                            </label>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="เช่น 50"
                              {...register("Land_Size")}
                            />
                            {errors.Land_Size && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.Land_Size.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ห้องนอน / ห้องน้ำ */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1">ห้องนอน</label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              {...register("Bedrooms")}
                            />
                            {errors.Bedrooms && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.Bedrooms.message}
                              </p>
                            )}
                          </div>
                          <div>
                            <label className="block mb-1">ห้องน้ำ</label>
                            <Input
                              type="number"
                              inputMode="numeric"
                              {...register("Bathroom")}
                            />
                            {errors.Bathroom && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.Bathroom.message}
                              </p>
                            )}
                          </div>
                        </div>

                        {/* ที่จอดรถ (Dropdown) */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block mb-1">ที่จอดรถ</label>
                            <select
                              className="w-full h-11 px-3 border rounded bg-background"
                              value={watch("Parking_Space") ?? ""}
                              onChange={(e) =>
                                setValue("Parking_Space", e.target.value, {
                                  shouldDirty: true,
                                  shouldValidate: true,
                                })
                              }
                            >
                              <option value="">เลือกจำนวนที่จอด</option>
                              <option value="0">ไม่มีที่จอด</option>
                              <option value="1">1 คัน</option>
                              <option value="2">2 คัน</option>
                              <option value="3">3 คันขึ้นไป</option>
                            </select>
                            {errors.Parking_Space && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.Parking_Space.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 4) ราคา (ย่อ) */}
                  <TabsContent value="price" className="mt-0">
                    <Card className="shadow-sm">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">ราคา</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          ประเภทประกาศ:{" "}
                          <span className="font-medium">
                            {sellRentLocked === "SALE"
                              ? "ขาย (SALE)"
                              : "ให้เช่า (RENT)"}
                          </span>{" "}
                          — ขั้นตอนนี้ไม่สามารถเปลี่ยนประเภทได้
                        </p>
                      </CardHeader>
                      <CardContent className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* ราคาขาย */}
                        <div>
                          <label className="block mb-1">ราคาขาย (บาท)</label>
                          <Input
                            type="number"
                            min="0"
                            step="1000"
                            {...register("Price")}
                          />
                          {errors.Price && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.Price.message}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            แสดงผล: {formatBaht(watch("Price"))} บาท
                          </p>
                        </div>

                        {/* เงินดาวน์ */}
                        <div>
                          <label className="block mb-1">เงินดาวน์ (บาท)</label>
                          <Input
                            type="number"
                            inputMode="decimal"
                            placeholder="เช่น 250000"
                            {...register("Deposit_Amount")}
                          />
                          {errors.Deposit_Amount && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.Deposit_Amount.message}
                            </p>
                          )}
                        </div>

                        {/* ดอกเบี้ย */}
                        <div>
                          <label className="block mb-1">
                            ดอกเบี้ยโดยประมาณ (%/ปี)
                          </label>
                          <Input
                            type="number"
                            step="0.01"
                            inputMode="decimal"
                            placeholder="เช่น 3.50"
                            {...register("Interest")}
                          />
                          {errors.Interest && (
                            <p className="text-red-500 text-sm mt-1">
                              {errors.Interest.message}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 5) ข้อมูลผู้ขาย — เหลือเฉพาะเบอร์/LINE/Facebook */}
                  <TabsContent value="inform" className="mt-0">
                    <Card className="shadow-sm">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">
                          ข้อมูลผู้ขาย / ช่องทางติดต่อ
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          {/* เบอร์โทร */}
                          <div>
                            <label className="block mb-1">เบอร์โทรศัพท์</label>
                            <Input
                              inputMode="tel"
                              placeholder="0812345678"
                              {...register("Phone")}
                            />
                            {errors.Phone && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.Phone.message}
                              </p>
                            )}
                          </div>
                          {/* LINE */}
                          <div>
                            <label className="block mb-1">ลิงก์ LINE</label>
                            <Input
                              type="url"
                              placeholder="https://line.me/ti/p/..."
                              {...register("Link_line")}
                            />
                            {errors.Link_line && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.Link_line.message}
                              </p>
                            )}
                          </div>
                          {/* Facebook */}
                          <div>
                            <label className="block mb-1">ลิงก์ Facebook</label>
                            <Input
                              type="url"
                              placeholder="https://facebook.com/username"
                              {...register("Link_facbook")}
                            />
                            {errors.Link_facbook && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.Link_facbook.message}
                              </p>
                            )}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  {/* 6) อัปโหลดรูป/วิดีโอ */}
                  <TabsContent value="media" className="mt-0">
                    <div className="grid md:grid-cols-2 gap-6">
                      <Card className="shadow-sm">
                        <CardHeader className="py-4">
                          <CardTitle className="text-lg">รูปภาพเดิม</CardTitle>
                        </CardHeader>
                        <CardContent>
                          {serverData?.Image?.length ? (
                            <div className="grid grid-cols-3 gap-3">
                              {serverData.Image.map((img) => (
                                <img
                                  key={img.id}
                                  src={img.url}
                                  alt="img"
                                  className="w-full h-24 object-cover rounded-lg border"
                                />
                              ))}
                            </div>
                          ) : (
                            <div className="h-24 rounded-lg bg-gray-100 flex items-center justify-center text-gray-500">
                              <ImageIcon className="w-5 h-5 mr-2" />
                              ไม่มีรูปภาพเดิม
                            </div>
                          )}
                          <p className="text-xs text-gray-500 mt-2">
                            *ไม่อัปโหลดใหม่ ระบบจะคงรูปเดิมไว้
                          </p>
                        </CardContent>
                      </Card>

                      <Card className="shadow-sm">
                        <CardHeader className="py-4">
                          <CardTitle className="text-lg">
                            อัปโหลดไฟล์ใหม่ (ไม่บังคับ)
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div>
                            <label className="block mb-1">
                              รูปภาพ (สูงสุด 5 รูป)
                            </label>
                            <Input
                              type="file"
                              accept="image/*"
                              multiple
                              onChange={(e) =>
                                setNewImages(
                                  Array.from(e.target.files || []).slice(0, 5)
                                )
                              }
                            />
                          </div>
                          <div>
                            <label className="block mb-1">
                              วิดีโอ (สูงสุด 2 ไฟล์)
                            </label>
                            <Input
                              type="file"
                              accept="video/*"
                              multiple
                              onChange={(e) =>
                                setNewVideos(
                                  Array.from(e.target.files || []).slice(0, 2)
                                )
                              }
                            />
                          </div>
                          {(newImages.length > 0 || newVideos.length > 0) && (
                            <p className="text-xs text-gray-500">
                              ระบบจะส่งไฟล์ใหม่ด้วย multipart หลังจากกดบันทึก
                            </p>
                          )}
                        </CardContent>
                      </Card>
                    </div>
                  </TabsContent>

                  {/* 7) ยืนยัน — รวมสรุปสำคัญ */}
                  <TabsContent value="confirm" className="mt-0">
                    <Card className="shadow-sm">
                      <CardHeader className="py-4">
                        <CardTitle className="text-lg">
                          ตรวจสอบและยืนยัน
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-6">
                        <div className="flex items-center text-green-600 gap-2">
                          <CheckCircle className="w-5 h-5" />
                          <p className="font-medium">
                            โปรดตรวจทานข้อมูลก่อนบันทึก
                          </p>
                        </div>

                        {/* สรุปเฉพาะ Detail (6 ฟิลด์) */}
                        <div>
                          <h4 className="font-semibold mb-3">
                            รายละเอียดทรัพย์ (ส่วนที่แก้ไขได้)
                          </h4>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-gray-500">ประเภท</p>
                              <p className="font-medium">
                                {categories.find(
                                  (c) =>
                                    String(c.id) === String(watch("categoryId"))
                                )?.name || "-"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">พื้นที่ใช้สอย</p>
                              <p className="font-medium">
                                {watch("Usable_Area") || "-"} ตร.ม.
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">ที่ดิน</p>
                              <p className="font-medium">
                                {watch("Land_Size") || "-"} ตร.วา
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">ห้องนอน</p>
                              <p className="font-medium">
                                {watch("Bedrooms") || "-"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">ห้องน้ำ</p>
                              <p className="font-medium">
                                {watch("Bathroom") || "-"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">ที่จอดรถ</p>
                              <p className="font-medium">
                                {
                                  {
                                    "": "-",
                                    0: "ไม่มีที่จอด",
                                    1: "1 คัน",
                                    2: "2 คัน",
                                    3: "3 คันขึ้นไป",
                                  }[String(watch("Parking_Space") ?? "")]
                                }
                              </p>
                            </div>
                          </div>
                        </div>

                        {/* สรุปส่วนอื่นที่ยังสำคัญ */}
                        <div>
                          <h4 className="font-semibold mb-3">ข้อมูลอื่น ๆ</h4>
                          <div className="grid md:grid-cols-2 gap-4 text-sm">
                            <div className="space-y-1">
                              <p className="text-gray-500">หัวข้อ</p>
                              <p className="font-medium">
                                {watch("Property_Name") || "-"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">ราคา</p>
                              <p className="font-medium">
                                {formatBaht(watch("Price"))} บาท
                              </p>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                              <p className="text-gray-500">รายละเอียด</p>
                              <p className="font-medium whitespace-pre-wrap">
                                {watch("Description") || "-"}
                              </p>
                            </div>

                            {/* ผู้ขายที่คงไว้ */}
                            <div className="space-y-1">
                              <p className="text-gray-500">เบอร์โทร</p>
                              <p className="font-medium">
                                {watch("Phone") || "-"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">LINE</p>
                              <p className="font-medium break-all">
                                {watch("Link_line") || "-"}
                              </p>
                            </div>
                            <div className="space-y-1">
                              <p className="text-gray-500">Facebook</p>
                              <p className="font-medium break-all">
                                {watch("Link_facbook") || "-"}
                              </p>
                            </div>

                            <div className="space-y-1 md:col-span-2">
                              <p className="text-gray-500">ที่อยู่</p>
                              <p className="font-medium">
                                {watch("Address") || "-"}
                                {watch("Province")
                                  ? `, ${watch("Province")}`
                                  : ""}
                                {watch("District")
                                  ? `, ${watch("District")}`
                                  : ""}
                                {watch("Subdistrict")
                                  ? `, ${watch("Subdistrict")}`
                                  : ""}
                                {watch("PostalCode")
                                  ? ` ${watch("PostalCode")}`
                                  : ""}
                              </p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>
                </>
              )}
            </div>
          </Tabs>

          {/* Footer ติดล่าง */}
          <div className="sticky bottom-0 z-10 -mx-6 px-6 py-3 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60 border-t flex justify-between items-center">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              ยกเลิก
            </Button>
            <div className="flex gap-2">
              <Button type="button" variant="outline" onClick={goPrev}>
                ย้อนกลับ
              </Button>
              <Button type="button" variant="outline" onClick={goNext}>
                ถัดไป
              </Button>
              <Button type="submit" disabled={loading}>
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    กำลังบันทึก...
                  </>
                ) : (
                  "บันทึกการเปลี่ยนแปลง"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
