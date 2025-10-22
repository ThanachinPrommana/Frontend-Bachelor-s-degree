// src/pages/Post_for_sale/PostDetail.jsx
import React, { useEffect } from "react";
import { useFieldArray, useFormContext } from "react-hook-form";
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

/* ------------ helpers ------------ */
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

/* ------------ enums ------------ */
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

/* ------------ Year_Built as string(yyyy) ------------ */
const yearStringOpt = z
  .string()
  .trim()
  .regex(/^\d{4}$/, "กรุณากรอกปี 4 หลัก")
  .transform((s) => Number(s))
  .refine((y) => y >= 1800 && y <= currentYear + 1, "ปีที่สร้างไม่สมเหตุสมผล")
  .transform((y) => String(y))
  .optional();

/* ------------ Schema (Total_Rooms optional + refine) ------------ */
const baseSchema = z.object({
  categoryId: z.string().min(1, "กรุณาเลือกประเภททรัพย์สิน"),
  Usable_Area: z.preprocess(toFloatOrUndef, z.number().min(0).optional()),
  Land_Size: z.preprocess(toFloatOrUndef, z.number().min(0).optional()),
  Total_Rooms: z.preprocess(toIntOrUndef, z.number().int().min(0).optional()),
  Bedrooms: z.preprocess(toIntOrUndef, z.number().int().min(0)),
  Bathroom: z.preprocess(toIntOrUndef, z.number().int().min(0)),
  floor: z.preprocess(toIntOrUndef, z.number().int().min(0).optional()), // UI จะซ่อนเฉพาะคอนโด
  Parking_Space: z.preprocess(toIntOrUndef, z.number().int().min(0).optional()),
  Year_Built: yearStringOpt,
  Nearby_Landmarks: z.array(LandmarkEnum).optional(),
  Additional_Amenities: z.array(AmenityEnum).optional(),
  NumberOfUnits: z.preprocess(
    toIntOrUndef,
    z.number().int().min(1, "ต้องมีอย่างน้อย 1")
  ),
  propertyUnits: z
    .array(z.object({ Unit_Number: z.string().min(1, "กรุณากรอกเลขที่") }))
    .min(1),
});

const detailSchema = baseSchema.superRefine((data, ctx) => {
  if (
    data.Total_Rooms != null &&
    data.Bedrooms != null &&
    data.Bathroom != null &&
    data.Total_Rooms < data.Bedrooms + data.Bathroom
  ) {
    ctx.addIssue({
      path: ["Total_Rooms"],
      code: z.ZodIssueCode.custom,
      message: "จำนวนห้องทั้งหมดต้องไม่น้อยกว่าห้องนอน + ห้องน้ำ",
    });
  }
});

/* ------------ categories ------------ */
const categories = [
  { id: "cmegzfhx70007w2bwp63cbc1w", label: "บ้านเดี่ยว" },
  { id: "cmegzft08000aw2bwx91l68z9", label: "ทาวน์เฮาส์" },
  { id: "cmegzfdya0006w2bwq5d8alc7", label: "คอนโดมิเนียม" },
  { id: "cmegzfov30009w2bwrxjpt7xn", label: "วิลล่า" },
];
const ALLOWED_CATEGORY_IDS = new Set(categories.map((c) => c.id));

/* ------------ dynamic config ------------ */
const CATEGORY_META = {
  condo: {
    id: "cmegzfdya0006w2bwq5d8alc7",
    show: { Land_Size: false, floor: false, Parking_Space: true, Units: true }, // ⬅ ซ่อน floor
    required: ["categoryId", "Bedrooms", "Bathroom"], // ไม่บังคับ floor
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  house: {
    id: "cmegzfhx70007w2bwp63cbc1w",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    required: ["categoryId", "Bedrooms", "Bathroom"],
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  townhouse: {
    id: "cmegzft08000aw2bwx91l68z9",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    required: ["categoryId", "Bedrooms", "Bathroom"],
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  villa: {
    id: "cmegzfov30009w2bwrxjpt7xn",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    required: ["categoryId", "Bedrooms", "Bathroom"],
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
};
const META_BY_ID = Object.fromEntries(
  Object.values(CATEGORY_META).map((m) => [m.id, m])
);

/* ------------ unit labels per category ------------ */
const getUnitLabel = (categoryId) => {
  switch (categoryId) {
    case CATEGORY_META.condo.id:
      return { group: "ข้อมูลห้องที่ขาย", item: "เลขห้องที่" }; // ⬅ คอนโด
    case CATEGORY_META.house.id:
    case CATEGORY_META.villa.id:
      return { group: "ข้อมูลบ้านที่ขาย", item: "บ้านเลขที่" };
    case CATEGORY_META.townhouse.id:
      return { group: "ข้อมูลคูหาที่ขาย", item: "เลขคูหาที่" };
    default:
      return { group: "ข้อมูลยูนิตที่ขาย", item: "เลขยูนิตที่" };
  }
};

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

export default function PostDetail() {
  const navigate = useNavigate();
  const form = useFormContext();
  const { control, watch } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "propertyUnits",
  });

  const numberOfUnits = watch("NumberOfUnits");
  const categoryId = watch("categoryId");
  const meta = META_BY_ID[categoryId] || { show: {} };
  const unitLabel = getUnitLabel(categoryId);

  const toggleArrayValue = (fieldName, value) => {
    const cur = Array.isArray(form.getValues(fieldName))
      ? form.getValues(fieldName)
      : [];
    const next = cur.includes(value)
      ? cur.filter((x) => x !== value)
      : [...cur, value];
    form.setValue(fieldName, next, { shouldDirty: true, shouldValidate: true });
  };

  // กันโพสต์เก่า: reset categoryId ถ้า id ไม่อยู่ใน allowed
  useEffect(() => {
    const cur = form.getValues("categoryId");
    if (cur && !ALLOWED_CATEGORY_IDS.has(cur)) {
      form.setValue("categoryId", "", {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ปรับค่าตามประเภท + ล้าง field ที่ถูกซ่อน
  useEffect(() => {
    const m = META_BY_ID[categoryId];
    if (!m) return;

    // ใส่ defaults เมื่อไม่มีค่า
    Object.entries(m.defaults || {}).forEach(([k, v]) => {
      const cur = form.getValues(k);
      if (cur === undefined || (Array.isArray(cur) && cur.length === 0)) {
        form.setValue(k, v, { shouldDirty: true, shouldValidate: false });
      }
    });

    // ล้างเมื่อซ่อน
    if (m.show.Land_Size === false) {
      form.setValue("Land_Size", undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
    if (m.show.floor === false) {
      form.setValue("floor", undefined, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [categoryId, form]);

  // sync จำนวนช่องกับ NumberOfUnits
  useEffect(() => {
    const currentCount = fields.length;
    const target = parseInt(numberOfUnits, 10) || 0;
    if (currentCount < target) {
      for (let i = currentCount; i < target; i++) append({ Unit_Number: "" });
    } else if (currentCount > target) {
      for (let i = currentCount; i > target; i--) remove(i - 1);
    }
  }, [numberOfUnits, fields.length, append, remove]);

  const BASE_REQUIRED = ["categoryId", "Bedrooms", "Bathroom"];

  const onSubmit = () => {
    const required = Array.from(
      new Set([...BASE_REQUIRED, ...(META_BY_ID[categoryId]?.required || [])])
    );

    // guard เผื่อผู้ใช้กรอก NumberOfUnits = 0
    const nUnits = form.getValues("NumberOfUnits");
    if (!nUnits || nUnits < 1) {
      form.setError("NumberOfUnits", {
        type: "manual",
        message: "ต้องมีอย่างน้อย 1",
      });
    }

    const ok = validateStep(form, detailSchema, [
      "categoryId",
      "Usable_Area",
      "Land_Size",
      "Total_Rooms", // ไม่บังคับ แต่ validate ถ้ามี
      "Year_Built",
      "Bedrooms",
      "Bathroom",
      // ไม่ต้อง include 'floor' ก็ได้ เพราะคอนโดถูกล้างค่า/ซ่อนอยู่แล้ว
      "Nearby_Landmarks",
      "Additional_Amenities",
      "Parking_Space",
      "NumberOfUnits",
      "propertyUnits",
      ...required,
    ]);

    console.log("[PostDetail] submit", { ok, errors: form.formState.errors });

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
                {meta.show.Land_Size !== false && (
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
                        <p className="text-xs mt-1 h-5 invisible">
                          placeholder
                        </p>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}
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
                          const raw = e.target.value.trim();
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

              {/* ห้องนอน/ห้องน้ำ/ห้องทั้งหมด/(ชั้น — ซ่อนในคอนโด) */}
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
                {meta.show.floor !== false && (
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
                            form.setValue(
                              "floor",
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
                )}
              </div>

              {/* ยูนิต/บ้าน/ห้อง ที่ขาย */}
              {meta.show.Units !== false && (
                <div className="space-y-4 rounded-lg border p-4">
                  <h3 className="font-semibold">{unitLabel.group}</h3>
                  <FormField
                    name="NumberOfUnits"
                    control={control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>จำนวนทั้งหมดที่ต้องการขาย</FormLabel>
                        <Input
                          type="number"
                          inputMode="numeric"
                          placeholder="เช่น 3"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            form.setValue(
                              "NumberOfUnits",
                              toIntOrUndef(e.target.value)
                            )
                          }
                          min={1}
                          step="1"
                          className="h-11 w-full md:w-1/2"
                        />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.map((f, index) => (
                    <FormField
                      key={f.id}
                      name={`propertyUnits.${index}.Unit_Number`}
                      control={control}
                      render={({ field: inputField }) => (
                        <FormItem>
                          <FormLabel>
                            {unitLabel.item} {index + 1}
                          </FormLabel>
                          <Input
                            placeholder={
                              unitLabel.item.includes("ห้อง")
                                ? `เช่น A-${100 + index}`
                                : `เช่น 27/${index + 1}`
                            }
                            {...inputField}
                          />
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>
              )}

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
              {meta.show.Parking_Space !== false && (
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
                        <option value="3">3 คันขึ้นไป </option>
                      </select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

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
}
