// src/pages/Post_for_sale/PostDetail.jsx
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

const currentYear = new Date().getFullYear();

/* ------------ helpers: แปลงเลขให้ถูกชนิด ------------ */
const toFloatOrUndef = (v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = Number(v);
  return Number.isFinite(n) ? n : undefined;
};
const toIntOrUndef = (v) => {
  if (v === "" || v === null || v === undefined) return undefined;
  const n = parseInt(String(v), 10);
  return Number.isFinite(n) ? n : undefined;
};

/* ------------ Prisma enums (จำกัดค่าที่รับ) ------------ */
const LandmarkEnum = z.enum([
  "BTS_MRT",
  "School",
  "Hospital",
  "Mall_Market",
  "Park",
]);
const AmenityEnum = z.enum([
  "Swimming_Pool",
  "Fitness_Center",
  "Co_working_Space",
  "Pet_Friendly",
]);

/* ------------ Year_Built: Prisma = String? (ปี 4 หลัก) ------------ */
const yearStringOpt = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "กรุณากรอกปี 4 หลัก")
  .transform((s) => Number(s))
  .refine((y) => y >= 1800 && y <= currentYear + 1, "ปีที่สร้างไม่สมเหตุสมผล")
  .transform((y) => String(y))
  .optional();

/* ------------ Schema ใช้ตรวจหน้า Detail เท่านั้น ------------ */
const detailSchema = z.object({
  categoryId: z.string().min(1, "กรุณาเลือกประเภททรัพย์สิน"),
  // ทศนิยมได้
  Usable_Area: z.preprocess(toFloatOrUndef, z.number().min(0).optional()),
  Land_Size: z.preprocess(toFloatOrUndef, z.number().min(0).optional()),
  // จำนวนเต็ม
  Total_Rooms: z.preprocess(toIntOrUndef, z.number().int().min(0).optional()),
  Bedrooms: z.preprocess(toIntOrUndef, z.number().int().min(0)),
  Bathroom: z.preprocess(toIntOrUndef, z.number().int().min(0)),
  floor: z.preprocess(toIntOrUndef, z.number().int().min(0).optional()),
  Parking_Space: z.preprocess(toIntOrUndef, z.number().int().min(0).optional()),
  // Year_Built เป็น string? ใน Prisma
  Year_Built: yearStringOpt,
  // arrays ต้องเป็นค่าที่อยู่ใน enum เท่านั้น
  Nearby_Landmarks: z.array(LandmarkEnum).optional(),
  Additional_Amenities: z.array(AmenityEnum).optional(),
});

// แสดงผลไทย แต่ส่งค่า id เดิม (ปรับตามฐานข้อมูลของคุณ)
const categories = [
  { id: "cmegzfdya0006w2bwq5d8alc7", label: "คอนโดมิเนียม" },
  { id: "cmegzfhx70007w2bwp63cbc1w", label: "บ้านเดี่ยว" },
  { id: "cmegzfls20008w2bwf0arh8jq", label: "ที่ดิน" },
  { id: "cmegzfov30009w2bwrxjpt7xn", label: "วิลล่า" },
  { id: "cmegzft08000aw2bwx91l68z9", label: "ทาวน์เฮาส์" },
  { id: "cmegzg3t1000cw2bw8shu6whw", label: "ตึกแถว/ช้อปเฮาส์" },
  { id: "cmegzg9ez000dw2bwgkdliy1a", label: "อพาร์ตเมนต์" },
  { id: "cmegzgcmy000ew2bw72nen7zo", label: "เพนท์เฮาส์" },
  { id: "cmegzgfvz000fw2bwgppl0ci5", label: "รีสอร์ท" },
  { id: "cmegzgif1000gw2bw1z7xda7u", label: "โรงแรม" },
  { id: "cmegzgky4000hw2bwe83xrvrg", label: "ออฟฟิศ" },
  { id: "cmegzgq6g000iw2bwl51st9pg", label: "อาคารพาณิชย์" },
  { id: "cmegzgu1s000jw2bwdhco4e1r", label: "โรงงาน" },
  { id: "cmegzgxsj000kw2bwebelhpmm", label: "โกดัง" },
];

const landmarks = [
  { value: "BTS_MRT", label: "ใกล้รถไฟฟ้า (BTS/MRT)" },
  { value: "School", label: "ใกล้โรงเรียน" },
  { value: "Hospital", label: "ใกล้โรงพยาบาล" },
  { value: "Mall_Market", label: "ใกล้ห้าง/ตลาด" },
  { value: "Park", label: "ใกล้สวนสาธารณะ" },
];

const amenitiesList = [
  { value: "Swimming_Pool", label: "สระว่ายน้ำ" },
  { value: "Fitness_Center", label: "ฟิตเนส" },
  { value: "Co_working_Space", label: "โคเวิร์กกิ้งสเปซ" },
  { value: "Pet_Friendly", label: "เลี้ยงสัตว์ได้" },
];

const PostDetail = () => {
  const navigate = useNavigate();
  const form = useFormContext();

  const toggleArrayValue = (fieldName, value) => {
    const currentValues = form.getValues(fieldName) || [];
    const next = currentValues.includes(value)
      ? currentValues.filter((x) => x !== value)
      : [...currentValues, value];
    form.setValue(fieldName, next, { shouldDirty: true, shouldValidate: true });
  };

  const onSubmit = () => {
    const ok = validateStep(form, detailSchema, [
      "categoryId",
      "Usable_Area",
      "Land_Size",
      "Total_Rooms",
      "Year_Built",
      "Bedrooms",
      "Bathroom",
      "floor",
      "Nearby_Landmarks",
      "Additional_Amenities",
      "Parking_Space",
    ]);
    if (!ok) return;
    navigate("/seller/post-for-sale/price");
  };

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
                กรอกข้อมูลตามความเป็นจริงเพื่อช่วยให้ผู้ซื้อค้นหาเจอง่ายขึ้น
              </p>
            </div>

            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                เลือก <span className="font-medium">ประเภททรัพย์สิน</span>{" "}
                และกรอกขนาด/จำนวนห้องให้ครบ ระบบจะตรวจสอบความถูกต้องให้อัตโนมัติ
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              noValidate
            >
              {/* ประเภททรัพย์สิน */}
              <FormField
                control={form.control}
                name="categoryId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ประเภททรัพย์สิน</FormLabel>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                      {categories.map((c) => {
                        const active = field.value === c.id;
                        return (
                          <Button
                            type="button"
                            key={c.id}
                            variant={active ? "default" : "outline"}
                            onClick={() =>
                              form.setValue("categoryId", c.id, {
                                shouldValidate: true,
                                shouldDirty: true,
                              })
                            }
                            aria-pressed={active}
                            className="h-10"
                          >
                            {c.label}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* พื้นที่/ที่ดิน/ปีที่สร้าง */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField
                  name="Usable_Area"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>พื้นที่ใช้สอย (ตร.ม.)</FormLabel>
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="เช่น 120"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          form.setValue(
                            "Usable_Area",
                            toFloatOrUndef(e.target.value),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          )
                        }
                        min={0}
                        step="0.01"
                        onWheel={(e) => e.currentTarget.blur()}
                        className="h-11"
                      />
                      <p className="text-xs mt-1 h-5 invisible">placeholder</p>
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
                      <Input
                        type="number"
                        inputMode="decimal"
                        placeholder="เช่น 50"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          form.setValue(
                            "Land_Size",
                            toFloatOrUndef(e.target.value),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          )
                        }
                        min={0}
                        step="0.01"
                        onWheel={(e) => e.currentTarget.blur()}
                        className="h-11"
                      />
                      <p className="text-xs mt-1 h-5 invisible">placeholder</p>
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
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder={`เช่น ${currentYear}`}
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) => {
                          const raw = e.target.value.trim(); // เก็บเป็น string ให้ตรง Prisma
                          form.setValue(
                            "Year_Built",
                            raw === "" ? undefined : raw,
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          );
                        }}
                        min={1800}
                        max={currentYear + 1}
                        onWheel={(e) => e.currentTarget.blur()}
                        className="h-11"
                      />
                      <p className="text-xs text-muted-foreground mt-1 h-5">
                        รองรับช่วงปี 1800 – {currentYear + 1}
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* ห้องนอน/ห้องน้ำ/ห้องทั้งหมด/ชั้น */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
                        onChange={(e) =>
                          form.setValue(
                            "Bedrooms",
                            toIntOrUndef(e.target.value),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          )
                        }
                        min={0}
                        step="1"
                        onWheel={(e) => e.currentTarget.blur()}
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
                        onChange={(e) =>
                          form.setValue(
                            "Bathroom",
                            toIntOrUndef(e.target.value),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          )
                        }
                        min={0}
                        step="1"
                        onWheel={(e) => e.currentTarget.blur()}
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
                        onChange={(e) =>
                          form.setValue(
                            "Total_Rooms",
                            toIntOrUndef(e.target.value),
                            {
                              shouldDirty: true,
                              shouldValidate: true,
                            }
                          )
                        }
                        min={0}
                        step="1"
                        onWheel={(e) => e.currentTarget.blur()}
                        className="h-11"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  name="floor"
                  control={form.control}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>จำนวนชั้น</FormLabel>
                      <Input
                        type="number"
                        inputMode="numeric"
                        placeholder="เช่น 2"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          form.setValue("floor", toIntOrUndef(e.target.value), {
                            shouldDirty: true,
                            shouldValidate: true,
                          })
                        }
                        min={0}
                        step="1"
                        onWheel={(e) => e.currentTarget.blur()}
                        className="h-11"
                      />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* สถานที่ใกล้เคียง */}
              <FormField
                control={form.control}
                name="Nearby_Landmarks"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สถานที่ใกล้เคียง</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {landmarks.map((item) => {
                        const selected = (field.value || []).includes(
                          item.value
                        );
                        return (
                          <Button
                            key={item.value}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            onClick={() =>
                              toggleArrayValue("Nearby_Landmarks", item.value)
                            }
                            aria-pressed={selected}
                            className="h-9"
                          >
                            {item.label}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* สิ่งอำนวยความสะดวก */}
              <FormField
                control={form.control}
                name="Additional_Amenities"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>สิ่งอำนวยความสะดวก</FormLabel>
                    <div className="flex flex-wrap gap-2">
                      {amenitiesList.map((item) => {
                        const selected = (field.value || []).includes(
                          item.value
                        );
                        return (
                          <Button
                            key={item.value}
                            type="button"
                            variant={selected ? "default" : "outline"}
                            onClick={() =>
                              toggleArrayValue(
                                "Additional_Amenities",
                                item.value
                              )
                            }
                            aria-pressed={selected}
                            className="h-9"
                          >
                            {item.label}
                          </Button>
                        );
                      })}
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ที่จอดรถ */}
              <FormField
                name="Parking_Space"
                control={form.control}
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ที่จอดรถ</FormLabel>
                    <select
                      className="w-full h-11 px-3 border rounded bg-background"
                      value={field.value ?? ""}
                      onChange={(e) => {
                        const v = e.target.value;
                        form.setValue(
                          "Parking_Space",
                          v === "" ? undefined : parseInt(v, 10),
                          {
                            shouldDirty: true,
                            shouldValidate: true,
                          }
                        );
                      }}
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

              {/* นำทาง */}
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
