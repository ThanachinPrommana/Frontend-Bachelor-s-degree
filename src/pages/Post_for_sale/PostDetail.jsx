import React from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PostLayout from "@/layouts/PostLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Home, Info } from "lucide-react";
import { validateStep } from "@/lib/zodRHF";

// ===== Schema (ใช้ preprocess ป้องกัน NaN และรองรับค่าว่าง) =====
const currentYear = new Date().getFullYear();

const numOpt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().min(0).optional()
);

const numReq = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z.number().min(0)
);

const yearOpt = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : Number(v)),
  z
    .number()
    .int()
    .min(1800, "ปีที่สร้างไม่สมเหตุสมผล")
    .max(currentYear + 1, "ปีที่สร้างเกินจริง")
    .optional()
);

const detailSchema = z.object({
  categoryId: z.string().min(1, "กรุณาเลือกประเภททรัพย์สิน"),
  Usable_Area: numOpt, // ตร.ม.
  Land_Size: numOpt, // ตร.วา
  Total_Rooms: numOpt,
  Year_Built: yearOpt, // ✅ แก้เรื่องปีที่สร้าง
  Bedrooms: numReq,
  Bathroom: numReq,
  Nearby_Landmarks: z.array(z.string()).optional(),
  Additional_Amenities: z.array(z.string()).optional(),
  Parking_Space: numOpt,
  notes: z.string().optional(),
});

const categories = [
  { id: "cmegzfdya0006w2bwq5d8alc7", name: "Condo" },
  { id: "cmegzfhx70007w2bwp63cbc1w", name: "House" },
  { id: "cmegzfls20008w2bwf0arh8jq", name: "Land" },
  { id: "cmegzfov30009w2bwrxjpt7xn", name: "Villa" },
  { id: "cmegzft08000aw2bwx91l68z9", name: "Townhouse" },
  { id: "cmegzg3t1000cw2bw8shu6whw", name: "Shop House" },
  { id: "cmegzg9ez000dw2bwgkdliy1a", name: "Apartment" },
  { id: "cmegzgcmy000ew2bw72nen7zo", name: "Penthouse" },
  { id: "cmegzgfvz000fw2bwgppl0ci5", name: "Resort" },
  { id: "cmegzgif1000gw2bw1z7xda7u", name: "Hotel" },
  { id: "cmegzgky4000hw2bwe83xrvrg", name: "Office" },
  { id: "cmegzgq6g000iw2bwl51st9pg", name: "Commercial Building" },
  { id: "cmegzgu1s000jw2bwdhco4e1r", name: "Factory" },
  { id: "cmegzgxsj000kw2bwebelhpmm", name: "Warehouse" },
];

const landmarks = ["BTS_MRT", "School", "Hospital", "Mall_Market", "Park"];
const amenitiesList = [
  "Swimming_Pool",
  "Fitness_Center",
  "Co_working_Space",
  "Pet_Friendly",
];

const PostDetail = () => {
  const navigate = useNavigate();
  const form = useFormContext();

  const toggleArrayValue = (fieldName, value) => {
    const currentValues = form.getValues(fieldName) || [];
    const newValues = currentValues.includes(value)
      ? currentValues.filter((item) => item !== value)
      : [...currentValues, value];
    form.setValue(fieldName, newValues, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const onSubmit = (data) => {
    const ok = validateStep(form, detailSchema, [
      "categoryId",
      "Usable_Area",
      "Land_Size",
      "Total_Rooms",
      "Year_Built",
      "Bedrooms",
      "Bathroom",
      "Nearby_Landmarks",
      "Additional_Amenities",
      "Parking_Space",
      "notes",
    ]);
    if (!ok) return;
    navigate("/seller/post-for-sale/price");
  };

  const formatDisplayName = (name) =>
    name.replace(/_/g, " ").replace("MRT", "/ MRT");

  return (
    <PostLayout currentStep={2}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardContent className="py-8 px-6 md:px-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Home className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">รายละเอียดทรัพย์สิน</h2>
              <p className="text-muted-foreground text-sm">
                โปรดกรอกข้อมูลทรัพย์สินของคุณ
              </p>
            </div>

            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                เลือก <span className="font-medium">ประเภททรัพย์สิน</span>{" "}
                แล้วกรอกขนาด/จำนวนห้องให้ครบ
                ระบบจะตรวจสอบความถูกต้องให้อัตโนมัติ
              </p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Property Type */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภททรัพย์สิน</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((category) => (
                        <Button
                          type="button"
                          key={category.id}
                          variant={
                            field.value === category.id ? "default" : "outline"
                          }
                          onClick={() =>
                            form.setValue("categoryId", category.id, {
                              shouldValidate: true,
                              shouldDirty: true,
                            })
                          }
                          aria-pressed={field.value === category.id}
                          className="h-10"
                        >
                          {category.name}
                        </Button>
                      ))}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Size / Land Area / Year Built */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name="Usable_Area"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>พื้นที่ใช้สอย (ตร.ม.)</FormLabel>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="เช่น 120"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="Land_Size"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>พื้นที่ดิน (ตร.วา)</FormLabel>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="เช่น 50"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="Year_Built"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ปีที่สร้าง</FormLabel>
                      <div className="relative">
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder={`เช่น ${currentYear}`}
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="h-11"
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        รองรับช่วงปี 1800 – {currentYear + 1}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Bedrooms / Bathrooms / Total Rooms */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name="Bedrooms"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ห้องนอน</FormLabel>
                      <Input
                        type="number"
                        inputMode="numeric"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-11"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="Bathroom"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ห้องน้ำ</FormLabel>
                      <Input
                        type="number"
                        inputMode="numeric"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-11"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="Total_Rooms"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนห้องทั้งหมด</FormLabel>
                      <Input
                        type="number"
                        inputMode="numeric"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        className="h-11"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Nearby Landmarks */}
              <FormField
                control={form.control}
                name="Nearby_Landmarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานที่ใกล้เคียง</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {landmarks.map((item) => {
                        const selected = (field.value || []).includes(item);
                        return (
                          <Button
                            type="button"
                            key={item}
                            variant={selected ? "default" : "outline"}
                            onClick={() =>
                              toggleArrayValue("Nearby_Landmarks", item)
                            }
                            aria-pressed={selected}
                            className="h-9"
                          >
                            {formatDisplayName(item)}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Amenities */}
              <FormField
                control={form.control}
                name="Additional_Amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สิ่งอำนวยความสะดวก</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {amenitiesList.map((item) => {
                        const selected = (field.value || []).includes(item);
                        return (
                          <Button
                            type="button"
                            key={item}
                            variant={selected ? "default" : "outline"}
                            onClick={() =>
                              toggleArrayValue("Additional_Amenities", item)
                            }
                            aria-pressed={selected}
                            className="h-9"
                          >
                            {formatDisplayName(item)}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Parking */}
              <FormField
                name="Parking_Space"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ที่จอดรถ</FormLabel>
                    <select
                      className="w-full h-11 px-3 border rounded bg-background"
                      value={field.value ?? ""}
                      onChange={(e) => field.onChange(e.target.value)}
                    >
                      <option value="">เลือกจำนวนที่จอด</option>
                      <option value="0">ไม่มีที่จอด</option>
                      <option value="1">1 คัน</option>
                      <option value="2">2 คัน</option>
                      <option value="3">3 คันขึ้นไป</option>
                    </select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Navigation */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/seller/post-for-sale/location")}
                >
                  ย้อนกลับ
                </Button>
                <Button type="submit" className="min-w-[120px]">
                  ถัดไป
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PostLayout>
  );
};

export default PostDetail;
