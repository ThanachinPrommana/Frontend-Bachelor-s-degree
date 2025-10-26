import React, { useEffect, useRef } from "react";
import { useFormContext, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const currentYear = new Date().getFullYear();

/* ===== dynamic config (ต้องแมพกับ DB ids ของโปรเจกต์) ===== */
const CATEGORY_META = {
  condo: {
    id: "cmegzfdya0006w2bwq5d8alc7",
    show: { Land_Size: false, floor: false, Parking_Space: true, Units: true },
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  house: {
    id: "cmegzfhx70007w2bwp63cbc1w",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  townhouse: {
    id: "cmegzft08000aw2bwx91l68z9",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
  villa: {
    id: "cmegzfov30009w2bwrxjpt7xn",
    show: { Land_Size: true, floor: true, Parking_Space: true, Units: true },
    defaults: { NumberOfUnits: 1, propertyUnits: [{ Unit_Number: "" }] },
  },
};
const META_BY_ID = Object.fromEntries(
  Object.values(CATEGORY_META).map((m) => [m.id, m])
);

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

  /* ===== Field Array ===== */
  const { fields, append, remove } = useFieldArray({
    control,
    name: "propertyUnits",
  });
  const numberOfUnits = watch("NumberOfUnits");

  /* ===== กันล้างค่าตอน mount: ล้างเมื่อ category "เปลี่ยนจริง ๆ" เท่านั้น ===== */
  const prevCatRef = useRef();
  useEffect(() => {
    const prev = prevCatRef.current;
    prevCatRef.current = categoryId;

    // ใส่ defaults เมื่อยังไม่มีค่า
    const m = META_BY_ID[categoryId];
    if (m?.defaults) {
      Object.entries(m.defaults).forEach(([k, v]) => {
        const cur = getValues(k);
        if (cur === undefined || (Array.isArray(cur) && cur.length === 0)) {
          setValue(k, v, { shouldDirty: false, shouldValidate: false });
        }
      });
    }

    // ล้างเฉพาะตอน category เปลี่ยน (ไม่ใช่ตอน mount)
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

  // toggle array
  const toggleArrayValue = (fieldName, value) => {
    const cur = Array.isArray(getValues(fieldName)) ? getValues(fieldName) : [];
    const next = cur.includes(value)
      ? cur.filter((x) => x !== value)
      : [...cur, value];
    setValue(fieldName, next, { shouldDirty: true, shouldValidate: true });
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">รายละเอียดทรัพย์ (แบบย่อ)</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Category */}
        <div className="space-y-2">
          <label className="block">ประเภททรัพย์สิน</label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {categories.map((c) => {
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
                  {c.name}
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
            *การเปลี่ยนหมวดหมู่อาจกระทบการค้นหา/การจัดกลุ่มประกาศ
          </p>
        </div>

        {/* Usable_Area & Land_Size */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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

          {meta.show?.Land_Size !== false && (
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
        </div>

        {/* Bedrooms, Bathroom, Total_Rooms, floor */}
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

          {meta.show?.floor !== false && (
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

        {/* Year_Built */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                  return raw === "" ? undefined : raw; // zod ตรวจ 4 หลัก/ช่วงปี
                },
              })}
            />
            {errors?.Year_Built && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Year_Built.message}
              </p>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              รองรับช่วงปี 1800 – {currentYear + 1} (ปล่อยว่างได้)
            </p>
          </div>
        </div>

        {/* Nearby_Landmarks */}
        <div className="space-y-2">
          <label className="block">สถานที่ใกล้เคียง</label>
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
        </div>

        {/* Additional_Amenities */}
        <div className="space-y-2">
          <label className="block">สิ่งอำนวยความสะดวก</label>
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
        </div>

        {/* Parking_Space */}
        {meta.show?.Parking_Space !== false && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1">ที่จอดรถ</label>
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
            </div>
          </div>
        )}

        {/* Units */}
        {meta.show?.Units !== false && (
          <div className="space-y-3 border rounded p-3">
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
          </div>
        )}
      </CardContent>
    </Card>
  );
}
