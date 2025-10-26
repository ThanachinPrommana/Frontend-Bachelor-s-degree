import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

// ====== Schemas ======
import { postTitleSchema } from "@/components/schemas/postSchemas/postTitleSchema";
import { postLocationSchema } from "@/components/schemas/postSchemas/postLocationSchema";
import { postDetailSchema } from "@/components/schemas/postSchemas/postDetailSchema";
import { postPriceSchema } from "@/components/schemas/postSchemas/postPriceSchema";
import { postInformSchema } from "@/components/schemas/postSchemas/postInformSchema";
import TitleStep from "./steps/TitleStep";

// ✅ ขยาย schema ราคา (เวอร์ชันย่อที่ใช้ใน Dialog นี้)
const postPriceExtended = postPriceSchema.safeExtend({
  Sell_Rent: z.enum(["SALE", "RENT"]).optional(),
// ... (fields อื่นๆ) ...
  Deposit_Amount: z
    .union([z.number().min(0), z.string()])
    .optional()
    .nullable(),
  Deposit_Percent: z
    .union([z.number().min(0).max(100), z.string()])
    .optional()
    .nullable(),
  Other_related_expenses: z.array(z.string()).optional(),
  Interest: z
    .union([z.number().min(0), z.string()])
    .optional()
    .nullable(),
});

const editPostSchema = postTitleSchema
  .and(postLocationSchema)
  .and(postDetailSchema)
  .and(postPriceExtended)
  .and(
    postInformSchema.pick({
      Name: true,
      Phone: true,
      Link_line: true,
      Link_facbook: true, // << ใช้คีย์นี้
    })
  );

const toNum = (v) =>
  v === "" || v === undefined || v === null || Number.isNaN(Number(v))
    ? undefined
    : Number(v);

export const formatBaht = (n) =>
  Number.isFinite(Number(n)) ? Number(n).toLocaleString() : "-";

// map API -> form (ใช้ Link_facbook เท่านั้น)
function mapApiToForm(d = {}) {
  const fbLinkRaw = d?.Link_facbook;
  const fbLink =
    typeof fbLinkRaw === "string"
      ? fbLinkRaw.trim()
      : String(fbLinkRaw ?? "").trim();

  const desc = d?.Description ?? d?.description ?? "";
  const propertyName = d?.Property_Name ?? d?.property_name ?? "";

  const sellerNameFromUser = [d?.user?.First_name, d?.user?.Last_name]
    .filter(Boolean)
    .join(" ")
    .trim();

  return {
    // title
    Property_Name: propertyName ?? "",
    Description: desc ?? "",

    // location
    Address: d?.Address ?? "",
    Province: d?.Province ?? "",
    District: d?.District ?? "",
    Subdistrict: d?.Subdistrict ?? "",
    LinkMap: d?.LinkMap ?? "",

    // detail
    categoryId: d?.categoryId ?? "",
    Usable_Area: d?.Usable_Area ?? undefined,
    Land_Size: d?.Land_Size ?? undefined,
    Bedrooms: d?.Bedrooms ?? undefined,
    Bathroom: d?.Bathroom ?? undefined,
    Total_Rooms: d?.Total_Rooms ?? undefined,
    floor: d?.floor ?? undefined,
    Year_Built: d?.Year_Built ?? undefined,
    Nearby_Landmarks: Array.isArray(d?.Nearby_Landmarks)
      ? d.Nearby_Landmarks
      : [],
    Additional_Amenities: Array.isArray(d?.Additional_Amenities)
      ? d.Additional_Amenities
      : [],
    Parking_Space:
      d?.Parking_Space === null || d?.Parking_Space === undefined
        ? undefined
        : d.Parking_Space,

    // units
    NumberOfUnits:
      d?.NumberOfUnits ??
      (Array.isArray(d?.PropertyUnit) && d.PropertyUnit.length > 0
        ? d.PropertyUnit.length
        : 1),
    propertyUnits:
      Array.isArray(d?.PropertyUnit) && d.PropertyUnit.length > 0
        ? d.PropertyUnit.map((u) => ({ Unit_Number: u?.Unit_Number ?? "" }))
        : [{ Unit_Number: "" }],

    // price
    Sell_Rent: d?.Sell_Rent ?? "SALE",
    Price: d?.Price ?? undefined,
    Deposit_Amount: d?.Deposit_Amount ?? undefined,
    Deposit_Percent: d?.Deposit_Percent ?? undefined,
    Interest: d?.Interest ?? undefined,
    Other_related_expenses: Array.isArray(d?.Other_related_expenses)
      ? d.Other_related_expenses.map(String)
      : [],

    // inform
    Name: (d?.Name ?? sellerNameFromUser ?? "").trim(),
    Phone: d?.Phone ?? "",
    Link_line: typeof d?.Link_line === "string" ? d.Link_line.trim() : "",
    Link_facbook: fbLink,
  };
}

export default function EditPostDialog({
  open,
  onOpenChange,
  postId,
  initialPost,
  onSaved,
}) {
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [activeTab, setActiveTab] = useState("title");
  const [serverData, setServerData] = useState(null);
  const [categories, setCategories] = useState([]);

  // ไฟล์ใหม่
  const [newImages, setNewImages] = useState([]);
  const [newVideos, setNewVideos] = useState([]);

  // รหัสสื่อเดิมที่ติ๊กว่าจะลบ (รับมาจาก MediaStep)
  const [removedOldImages, setRemovedOldImages] = useState([]);
  const [removedOldVideos, setRemovedOldVideos] = useState([]);

  const [resetKey, setResetKey] = useState(0);

  const methods = useForm({
    resolver: zodResolver(editPostSchema),
    defaultValues: mapApiToForm(),
    mode: "onChange",
  });

  const {
    handleSubmit,
    reset,
    trigger,
    watch,
    formState: { errors },
  } = methods;

  const tabOrder = [
    "title",
    "location",
    "detail",
    "price",
    "inform",
    "media",
    "confirm",
  ];

  useEffect(() => {
    if (!open) return;
    (async () => {
      try {
        const catRes = await apiClient.get("/allcategory");
        setCategories(catRes.data || []);
      } catch {
        /* non-blocking */
      }
    })();
  }, [open]);

  useEffect(() => {
    if (!open) return;

    // เปิดจาก initialPost (ไม่มี postId)
    if (!postId) {
      if (initialPost) {
        setServerData(initialPost);
        reset(mapApiToForm(initialPost), {
          keepDefaultValues: false,
          keepDirtyValues: false,
        });
        setResetKey((k) => k + 1);
      }
      return;
    }

    let alive = true;
    (async () => {
      try {
        setLoadingData(true);
        const res = await apiClient.get(`/propertypost/${postId}`);
        if (!alive) return;
        const data = res?.data || {};
        setServerData(data);
        reset(mapApiToForm(data), {
          keepDefaultValues: false,
          keepDirtyValues: false,
        });
        setActiveTab("title");
      } catch (e) {
        console.error("[EditPostDialog] getPost failed:", e);
        if (initialPost) {
          setServerData(initialPost);
          reset(mapApiToForm(initialPost), {
            keepDefaultValues: false,
            keepDirtyValues: false,
          });
        } else {
          setServerData(null);
          reset(mapApiToForm(), {
            keepDefaultValues: false,
            keepDirtyValues: false,
          });
        }
      } finally {
        if (!alive) return;
        setLoadingData(false);
        setResetKey((k) => k + 1);
        // reset ตัวแปรสื่อทุกครั้งที่โหลดโพสต์ใหม่
        setNewImages([]);
        setNewVideos([]);
        setRemovedOldImages([]);
        setRemovedOldVideos([]);
      }
    })();

    return () => {
      alive = false;
    };
  }, [open, postId, initialPost, reset]);

  const fieldsPerTab = {
    title: ["Property_Name", "Description"],
    location: ["Address", "Province", "District", "Subdistrict", "LinkMap"],
    detail: [
      "categoryId",
      "Usable_Area",
      "Land_Size",
      "Bedrooms",
      "Bathroom",
      "Total_Rooms",
      "floor",
      "Year_Built",
      "Nearby_Landmarks",
      "Additional_Amenities",
      "Parking_Space",
      "NumberOfUnits",
      "propertyUnits",
    ],
    price: [
      "Sell_Rent",
      "Price",
      "Deposit_Amount",
      "Deposit_Percent",
      "Other_related_expenses",
      "Interest",
    ],
    inform: ["Name", "Phone", "Link_line", "Link_facbook"],
    media: [],
    confirm: [],
  };

  const goNext = async () => {
    const idx = tabOrder.indexOf(activeTab);
    if (idx === -1 || idx >= tabOrder.length - 1) return;
    const ok = await trigger(fieldsPerTab[activeTab]);
    if (!ok) return;
    setActiveTab(tabOrder[idx + 1]);
  };
  const goPrev = () => {
    const idx = tabOrder.indexOf(activeTab);
    if (idx > 0) setActiveTab(tabOrder[idx - 1]);
  };

  const sellRentLocked = watch("Sell_Rent") || "SALE";

  const onSubmit = async (values) => {
    if (!postId) return;
    try {
      setLoading(true);
      const hasFiles = newImages.length > 0 || newVideos.length > 0;

      const payload = {
        ...values,
        Sell_Rent: sellRentLocked,
        // numbers
        Usable_Area: toNum(values.Usable_Area),
        Land_Size: toNum(values.Land_Size),
        Price: toNum(values.Price),
        Deposit_Amount: toNum(values.Deposit_Amount),
        Deposit_Percent: toNum(values.Deposit_Percent),
        Bedrooms: toNum(values.Bedrooms),
        Bathroom: toNum(values.Bathroom),
        Total_Rooms: toNum(values.Total_Rooms),
        Parking_Space: toNum(values.Parking_Space),
        floor: toNum(values.floor),
        Interest: toNum(values.Interest),
        // arrays
        Nearby_Landmarks: values.Nearby_Landmarks || [],
        Additional_Amenities: values.Additional_Amenities || [],
        Other_related_expenses: values.Other_related_expenses || [],
        // contact (ใช้ Link_facbook)
        Name: values.Name ?? "",
        Link_line: values.Link_line ?? "",
        Link_facbook: values.Link_facbook ?? "",

        // ⬇️ ใหม่: id ของสื่อเดิมที่ติ๊กว่าจะลบ
        removedOldImages: removedOldImages || [],
        removedOldVideos: removedOldVideos || [],
      };

      if (hasFiles) {
        const fd = new FormData();
        Object.entries(payload).forEach(([k, v]) => {
          // ส่ง array เป็น JSON string (รวมถึง removedOld* ด้วย)
          if (Array.isArray(v)) fd.append(k, JSON.stringify(v));
          else if (v !== undefined && v !== null) fd.append(k, v);
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

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* กรอบนอก: กว้าง/สูงแบบที่ชอบ + ภายในจัดให้พอดีจอ */}
      <DialogContent className="p-0 max-w-[95vw] md:max-w-[1280px] md:h-[90vh] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 pt-6 pb-3 flex-shrink-0">
          <DialogTitle className="text-2xl">แก้ไขประกาศ</DialogTitle>
          <DialogDescription className="text-gray-600">
            ดึงข้อมูลตรงจาก getPost แล้วอัปเดตด้วย updatePost
          </DialogDescription>
        </DialogHeader>

        <FormProvider {...methods}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="grid grid-rows-[auto,1fr,auto] h-[calc(90vh-96px)]"
          >
            {/* Tabs bar (sticky + scrollable) */}
            <div className="px-6 pb-2 sticky top-0 z-10 bg-white/90 backdrop-blur border-y">
              <div className="max-w-[1100px] mx-auto">
                <Tabs
                  value={activeTab}
                  onValueChange={setActiveTab}
                  className="w-full"
                >
                  <TabsList className="w-full overflow-x-auto flex gap-2 bg-muted/50 rounded-xl p-1">
                    <TabsTrigger value="title" className="whitespace-nowrap">
                      หัวข้อ
                    </TabsTrigger>
                    <TabsTrigger value="location" className="whitespace-nowrap">
                      ที่ตั้ง
                    </TabsTrigger>
                    <TabsTrigger value="detail" className="whitespace-nowrap">
                      รายละเอียด
                    </TabsTrigger>
                    <TabsTrigger value="price" className="whitespace-nowrap">
                      ราคา
                    </TabsTrigger>
                    <TabsTrigger value="inform" className="whitespace-nowrap">
                      ผู้ขาย
                    </TabsTrigger>
                    <TabsTrigger value="media" className="whitespace-nowrap">
                      รูป/วิดีโอ
                    </TabsTrigger>
                    <TabsTrigger value="confirm" className="whitespace-nowrap">
                      ยืนยัน
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </div>

            {/* Scrollable content */}
            <div className="overflow-y-auto">
              <div className="px-6 py-4">
                <div className="max-w-[1100px] mx-auto">
                  {loadingData ? (
                    <div className="flex items-center justify-center py-14 text-gray-500">
                      <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                      กำลังโหลดข้อมูล...
                    </div>
                  ) : (
                    <>
                      {activeTab === "title" && (
                        <div className="space-y-6">
                          <TitleStep errors={errors} resetKey={resetKey} />
                        </div>
                      )}
                      {activeTab === "location" && (
                        <div className="space-y-6">
                          <LocationStep errors={errors} resetKey={resetKey} />
                        </div>
                      )}
                      {activeTab === "detail" && (
                        <div className="space-y-6">
                          <DetailStep
                            errors={errors}
                            categories={categories}
                            resetKey={resetKey}
                          />
                        </div>
                      )}
                      {activeTab === "price" && (
                        <div className="space-y-6">
                          <PriceStep
                            errors={errors}
                            sellRentLocked={watch("Sell_Rent") || "SALE"}
                            formatBaht={formatBaht}
                            resetKey={resetKey}
                          />
                        </div>
                      )}
                      {activeTab === "inform" && (
                        <div className="space-y-6">
                          <InformStep errors={errors} resetKey={resetKey} />
                        </div>
                      )}
                      {activeTab === "media" && (
                        <div className="space-y-6">
                          <MediaStep
                            serverData={serverData}
                            newImages={newImages}
                            setNewImages={setNewImages}
                            newVideos={newVideos}
                            setNewVideos={setNewVideos}
                            resetKey={resetKey}
                            removedOldImages={removedOldImages}
                            setRemovedOldImages={setRemovedOldImages}
                            removedOldVideos={removedOldVideos}
                            setRemovedOldVideos={setRemovedOldVideos}
                          />
                        </div>
                      )}
                      {activeTab === "confirm" && (
                        <div className="space-y-6">
                          <ConfirmStep
                            categories={categories}
                            formatBaht={formatBaht}
                            watch={watch}
                            resetKey={resetKey}
                          />
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="px-6 py-3 bg-white/90 backdrop-blur border-t">
              <div className="max-w-[1100px] mx-auto flex justify-between">
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
                  <Button
                    type="submit"
                    disabled={loading}
                    className="min-w-[168px]"
                  >
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
            </div>
          </form>
        </FormProvider>
      </DialogContent>
    </Dialog>
  );
}
