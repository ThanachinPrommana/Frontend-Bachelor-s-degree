// src/components/PostComponents/EditPostDialog/steps/DetailStep.jsx
import React, { useEffect, useRef } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const currentYear = new Date().getFullYear();

/* ====== แมพกับ DB IDs ของโปรเจกต์ ====== */
const CATEGORY_META = {
  condo: {
    id: "cmegzfdya0006w2bwq5d8alc7",
    th: "คอนโดมิเนียม",
    show: { Land_Size: false, floor: false, Parking_Space: true, Units: true },
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  house: {
    id: "cmegzfhx70007w2bwp63cbc1w",
    th: "บ้านเดี่ยว",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  townhouse: {
    id: "cmegzft08000aw2bwx91l68z9",
    th: "ทาวน์โฮม",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  villa: {
    id: "cmegzfov30009w2bwrxjpt7xn",
    th: "วิลลา",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
};

const META_BY_ID = Object.fromEntries(
  Object.values(CATEGORY_META).map((m) => [m.id, m])
);

/* ลำดับปุ่มตามดีไซน์: บ้านเดี่ยว → ทาวน์โฮม → คอนโดมิเนียม → วิลลา */
const CATEGORY_ORDER = [
  CATEGORY_META.house.id,
  CATEGORY_META.townhouse.id,
  CATEGORY_META.condo.id,
  CATEGORY_META.villa.id,
];

const getUnitLabel = (categoryId) => {
  switch (categoryId) {
    case CATEGORY_META.condo.id:
      return { group: "ข้อมูลห้องที่ขาย", item: "เลขห้องที่" };
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

export default function DetailStep({ errors, categories, resetKey }) {
  const { register, setValue, watch, control, getValues } = useFormContext();

  const categoryId = watch("categoryId") ?? "";
  const meta = META_BY_ID[categoryId] || { show: {} };
  const unitLabel = getUnitLabel(categoryId);

  /* ----- Field Array: ยูนิต ----- */
  const { fields, append, remove } = useFieldArray({
    control,
    name: "propertyUnits",
  });
  const numberOfUnits = watch("NumberOfUnits");

  /* ใส่ค่าเริ่มต้น + เคลียร์ฟิลด์ที่ไม่ใช้เมื่อสลับประเภท */
  const prevCatRef = useRef();
  useEffect(() => {
    const prev = prevCatRef.current;
    prevCatRef.current = categoryId;

    const m = META_BY_ID[categoryId];
    if (m?.defaults) {
      Object.entries(m.defaults).forEach(([k, v]) => {
        const cur = getValues(k);
        if (cur === undefined || (Array.isArray(cur) && cur.length === 0)) {
          setValue(k, v, { shouldDirty: false, shouldValidate: false });
        }
      });
    }
    if (prev !== undefined && prev !== categoryId) {
      if (meta.show?.Land_Size === false) {
        setValue("Land_Size", undefined, {
          shouldDirty: true,
          shouldValidate: false,
        });
      }
      if (meta.show?.floor === false) {
        setValue("floor", undefined, {
          shouldDirty: true,
          shouldValidate: false,
        });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [categoryId]);

  /* sync จำนวนช่องกับ NumberOfUnits */
  useEffect(() => {
    const currentCount = fields.length;
    const target = parseInt(numberOfUnits, 10) || 0;
    if (currentCount < target) {
      for (let i = currentCount; i < target; i++) append({ Unit_Number: "" });
    } else if (currentCount > target) {
      for (let i = currentCount; i > target; i--) remove(i - 1);
    }
  }, [numberOfUnits, fields.length, append, remove]);

  const toggleArrayValue = (fieldName, value) => {
    const cur = Array.isArray(getValues(fieldName)) ? getValues(fieldName) : [];
    const next = cur.includes(value)
      ? cur.filter((x) => x !== value)
      : [...cur, value];
    setValue(fieldName, next, { shouldDirty: true, shouldValidate: true });
  };

  /* ===== เตรียมปุ่มประเภททรัพย์ (ใช้ชื่อไทยจากแมพ + จัดเรียงตาม CATEGORY_ORDER) ===== */
  const categoryButtons = CATEGORY_ORDER.map((id) => {
    const meta = META_BY_ID[id];
    return meta ? { id, label: meta.th } : null;
  }).filter(Boolean);

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl" role="img" aria-label="detail">
            🧱
          </span>
          <CardTitle className="text-xl">รายละเอียดทรัพย์สิน</CardTitle>
          <p className="text-xs text-muted-foreground text-center">
            กรอกข้อมูลตามความเป็นจริงเพื่อช่วยให้ผู้ซื้อค้นหาเจอและตัดสินใจได้ดีขึ้น
          </p>
        </div>
      </CardHeader>

      <CardContent className="space-y-8">
        {/* ========== ประเภททรัพย์สิน ========== */}
        <section className="space-y-2">
          <div className="text-sm font-medium">ประเภททรัพย์สิน</div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {categoryButtons.map((c) => {
              const active = String(categoryId) === String(c.id);
              return (
                <Button
                  key={`${c.id}-${resetKey}`}
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
                  {c.label}
                </Button>
              );
            })}
          </div>
          {errors?.categoryId && (
            <p className="text-red-500 text-sm mt-1">
              {errors.categoryId.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground mt-1">
            *เลือก ประเภททรัพย์สิน และกรอกรายละเอียด/จำนวนห้องให้ครบ
            ระบบจะตรวจสอบความถูกต้องให้อัตโนมัติ
          </p>
        </section>

        {/* ========== ขนาด / พื้นที่ + ปีที่สร้าง ========== */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block mb-1">พื้นที่ใช้สอย (ตร.ม.)</label>
            <Input
              key={`usable-${resetKey}`}
              type="number"
              inputMode="decimal"
              placeholder="เช่น 120"
              {...register("Usable_Area", {
                setValueAs: (v) =>
                  v === "" || v == null ? undefined : Number(v),
              })}
            />
            {errors?.Usable_Area && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Usable_Area.message}
              </p>
            )}
          </div>

          {META_BY_ID[categoryId]?.show?.Land_Size !== false && (
            <div>
              <label className="block mb-1">ขนาดที่ดิน (ตร.วา)</label>
              <Input
                key={`land-${resetKey}`}
                type="number"
                inputMode="decimal"
                placeholder="เช่น 50"
                {...register("Land_Size", {
                  setValueAs: (v) =>
                    v === "" || v == null ? undefined : Number(v),
                })}
              />
              {errors?.Land_Size && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Land_Size.message}
                </p>
              )}
            </div>
          )}

          <div>
            <label className="block mb-1">ปีที่สร้าง</label>
            <Input
              key={`year-${resetKey}`}
              type="number"
              inputMode="numeric"
              placeholder={`เช่น ${currentYear}`}
              min={1800}
              max={currentYear + 1}
              {...register("Year_Built", {
                setValueAs: (v) => {
                  const raw = String(v ?? "").trim();
                  return raw === "" ? undefined : raw;
                },
              })}
            />
            {errors?.Year_Built && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Year_Built.message}
              </p>
            )}
            <p className="text-[11px] text-muted-foreground mt-1">
              รองรับช่วงปี 1800 – {currentYear + 1} (ปล่อยว่างได้)
            </p>
          </div>
        </section>

        {/* ========== สเปกห้อง ========== */}
        <section>
          <div className="text-sm font-medium mb-3">สเปกห้อง</div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block mb-1">ห้องนอน</label>
              <Input
                key={`bed-${resetKey}`}
                type="number"
                inputMode="numeric"
                {...register("Bedrooms", {
                  setValueAs: (v) =>
                    v === "" || v == null ? undefined : parseInt(v, 10),
                })}
              />
              {errors?.Bedrooms && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Bedrooms.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1">ห้องน้ำ</label>
              <Input
                key={`bath-${resetKey}`}
                type="number"
                inputMode="numeric"
                {...register("Bathroom", {
                  setValueAs: (v) =>
                    v === "" || v == null ? undefined : parseInt(v, 10),
                })}
              />
              {errors?.Bathroom && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Bathroom.message}
                </p>
              )}
            </div>

            <div>
              <label className="block mb-1">จำนวนห้องทั้งหมด</label>
              <Input
                key={`total-${resetKey}`}
                type="number"
                inputMode="numeric"
                {...register("Total_Rooms", {
                  setValueAs: (v) =>
                    v === "" || v == null ? undefined : parseInt(v, 10),
                })}
              />
              {errors?.Total_Rooms && (
                <p className="text-red-500 text-sm mt-1">
                  {errors.Total_Rooms.message}
                </p>
              )}
            </div>

            {META_BY_ID[categoryId]?.show?.floor !== false && (
              <div>
                <label className="block mb-1">จำนวนชั้น</label>
                <Input
                  key={`floor-${resetKey}`}
                  type="number"
                  inputMode="numeric"
                  placeholder="เช่น 2"
                  {...register("floor", {
                    setValueAs: (v) =>
                      v === "" || v == null ? undefined : parseInt(v, 10),
                  })}
                />
                {errors?.floor && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.floor.message}
                  </p>
                )}
              </div>
            )}
          </div>
        </section>

        {/* ========== สถานที่ใกล้เคียง ========== */}
        <section className="space-y-2">
          <div className="text-sm font-medium">สถานที่ใกล้เคียง</div>
          <div className="flex flex-wrap gap-2">
            {landmarks.map((item) => {
              const selected = (watch("Nearby_Landmarks") || []).includes(
                item.value
              );
              return (
                <Button
                  key={`lm-${item.value}-${resetKey}`}
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
          {errors?.Nearby_Landmarks && (
            <p className="text-red-500 text-sm mt-1">
              {errors.Nearby_Landmarks.message}
            </p>
          )}
        </section>

        {/* ========== สิ่งอำนวยความสะดวก ========== */}
        <section className="space-y-2">
          <div className="text-sm font-medium">สิ่งอำนวยความสะดวก</div>
          <div className="flex flex-wrap gap-2">
            {amenitiesList.map((item) => {
              const selected = (watch("Additional_Amenities") || []).includes(
                item.value
              );
              return (
                <Button
                  key={`am-${item.value}-${resetKey}`}
                  type="button"
                  variant={selected ? "default" : "outline"}
                  onClick={() =>
                    toggleArrayValue("Additional_Amenities", item.value)
                  }
                  aria-pressed={selected}
                  className="h-9"
                >
                  {item.label}
                </Button>
              );
            })}
          </div>
          {errors?.Additional_Amenities && (
            <p className="text-red-500 text-sm mt-1">
              {errors.Additional_Amenities.message}
            </p>
          )}
        </section>

        {/* ========== ที่จอดรถ ========== */}
        {META_BY_ID[categoryId]?.show?.Parking_Space !== false && (
          <section>
            <div className="text-sm font-medium mb-3">ที่จอดรถ</div>
            <select
              key={`park-${resetKey}`}
              className="w-full h-11 px-3 border rounded bg-background"
              {...register("Parking_Space", {
                setValueAs: (v) => (v === "" ? undefined : parseInt(v, 10)),
              })}
              defaultValue={String(getValues("Parking_Space") ?? "")}
            >
              <option value="">เลือกจำนวนที่จอด</option>
              <option value="0">ไม่มีที่จอด</option>
              <option value="1">1 คัน</option>
              <option value="2">2 คัน</option>
              <option value="3">3 คันขึ้นไป</option>
            </select>
            {errors?.Parking_Space && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Parking_Space.message}
              </p>
            )}
          </section>
        )}

        {/* ========== ยูนิตที่ขาย ========== */}
        {META_BY_ID[categoryId]?.show?.Units !== false && (
          <section className="space-y-3 border rounded-lg p-4">
            <div className="font-medium">{unitLabel.group}</div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block mb-1">จำนวนทั้งหมดที่ต้องการขาย</label>
                <Input
                  key={`units-${resetKey}`}
                  type="number"
                  inputMode="numeric"
                  placeholder="เช่น 1"
                  {...register("NumberOfUnits", {
                    setValueAs: (v) =>
                      v === "" || v == null ? undefined : parseInt(v, 10),
                  })}
                />
                {errors?.NumberOfUnits && (
                  <p className="text-red-500 text-sm mt-1">
                    {errors.NumberOfUnits.message}
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {fields.map((f, index) => (
                <div key={f.id}>
                  <label className="block mb-1">
                    {unitLabel.item} {index + 1}
                  </label>
                  <Input
                    key={`unit-${index}-${resetKey}`}
                    placeholder={
                      unitLabel.item.includes("ห้อง")
                        ? `เช่น A-${100 + index}`
                        : `เช่น 27/${index + 1}`
                    }
                    {...register(`propertyUnits.${index}.Unit_Number`)}
                  />
                  {errors?.propertyUnits?.[index]?.Unit_Number && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.propertyUnits[index].Unit_Number.message}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </section>
        )}
      </CardContent>
    </Card>
  );
}
