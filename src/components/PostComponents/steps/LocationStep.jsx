// src/components/PostComponents/EditPostDialog/steps/LocationStep.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

/** Latest endpoints (เหมือนหน้า postLocation) */
const PROVINCE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province.json";
const DISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/district.json";
const SUBDISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district.json";

function assertOk(res, msg) {
  if (!res.ok) throw new Error(`${msg} (HTTP ${res.status})`);
  return res;
}

/** ✅ อนุญาตเฉพาะ กทม. และปริมณฑล */
const ALLOWED_PROVINCES = [
  "กรุงเทพมหานคร",
  "นนทบุรี",
  "ปทุมธานี",
  "สมุทรปราการ",
  "สมุทรสาคร",
  "นครปฐม",
];

const norm = (s) => String(s ?? "").trim();
const safeEq = (a, b) => norm(a) === norm(b);
const isAllowedProvince = (p) => ALLOWED_PROVINCES.map(norm).includes(norm(p));

export default function LocationStep({ errors, resetKey }) {
  const form = useFormContext();

  /** master lists */
  const [provinces, setProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSubDistricts, setAllSubDistricts] = useState([]);
  const [loading, setLoading] = useState(true);
  const abortRef = useRef(null);

  // โหลด master ทั้งหมดครั้งเดียว + abort เมื่อ unmount
  useEffect(() => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    (async () => {
      try {
        setLoading(true);
        const [provRes, distRes, subRes] = await Promise.all([
          fetch(PROVINCE_URL, { signal: controller.signal, cache: "default" })
            .then((r) => assertOk(r, "โหลดจังหวัดล้มเหลว"))
            .then((r) => r.json()),
          fetch(DISTRICT_URL, { signal: controller.signal, cache: "default" })
            .then((r) => assertOk(r, "โหลดอำเภอล้มเหลว"))
            .then((r) => r.json()),
          fetch(SUBDISTRICT_URL, {
            signal: controller.signal,
            cache: "default",
          })
            .then((r) => assertOk(r, "โหลดตำบลล้มเหลว"))
            .then((r) => r.json()),
        ]);

        setProvinces(provRes || []);
        setAllDistricts(distRes || []);
        setAllSubDistricts(subRes || []);
      } catch (err) {
        if (err?.name !== "AbortError")
          console.error("[LocationStep] โหลดจังหวัด/อำเภอ/ตำบลไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  /** index maps */
  const districtsByProv = useMemo(() => {
    const m = new Map();
    for (const d of allDistricts) {
      const k = String(d.province_id);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(d);
    }
    return m;
  }, [allDistricts]);

  const subDistrictsByDist = useMemo(() => {
    const m = new Map();
    for (const sd of allSubDistricts) {
      const k = String(sd.district_id);
      if (!m.has(k)) m.set(k, []);
      m.get(k).push(sd);
    }
    return m;
  }, [allSubDistricts]);

  /** allowed provinces list */
  const allowedProvinceList = useMemo(
    () => provinces.filter((p) => isAllowedProvince(p.name_th)),
    [provinces]
  );

  /** Derived จากค่าปัจจุบันในฟอร์ม */
  const currentProvince = form.watch("Province");
  const currentDistrict = form.watch("District");

  // ถ้า province จากข้อมูลเดิมไม่อยู่ใน allowed จะถือว่าไม่ได้เลือก (ป้องกัน dropdown ค้างค่า)
  const effectiveProvince = isAllowedProvince(currentProvince)
    ? currentProvince
    : "";

  const derivedDistricts = useMemo(() => {
    if (!effectiveProvince) return [];
    const p = provinces.find((x) => safeEq(x.name_th, effectiveProvince));
    return p ? districtsByProv.get(String(p.id)) || [] : [];
  }, [effectiveProvince, provinces, districtsByProv]);

  const derivedSubDistricts = useMemo(() => {
    if (!currentDistrict) return [];
    const d = derivedDistricts.find((x) => safeEq(x.name_th, currentDistrict));
    return d ? subDistrictsByDist.get(String(d.id)) || [] : [];
  }, [currentDistrict, derivedDistricts, subDistrictsByDist]);

  /** onChange handlers */
  const handleProvinceChange = (provinceName) => {
    if (!isAllowedProvince(provinceName)) return;
    form.setValue("Province", provinceName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    // reset dependent
    form.resetField("District");
    form.resetField("Subdistrict");
  };

  const handleDistrictChange = (districtName) => {
    form.setValue("District", districtName, {
      shouldDirty: true,
      shouldValidate: true,
    });
    form.resetField("Subdistrict");
  };

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">ที่ตั้งทรัพย์</CardTitle>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Province */}
        <div className="md:col-span-2">
          <label className="block mb-1">จังหวัด</label>
          <Select
            key={`prov-sel-${resetKey}`}
            value={effectiveProvince || ""}
            onValueChange={handleProvinceChange}
            disabled={loading}
          >
            <SelectTrigger className="h-11 cursor-pointer">
              <SelectValue
                placeholder={loading ? "กำลังโหลด..." : "เลือกจังหวัด"}
              />
            </SelectTrigger>
            <SelectContent>
              {allowedProvinceList.map((prov) => (
                <SelectItem
                  key={prov.id}
                  value={prov.name_th}
                  className="cursor-pointer"
                >
                  {prov.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.Province && (
            <p className="text-red-500 text-sm mt-1">
              {errors.Province.message}
            </p>
          )}
        </div>

        {/* District */}
        <div>
          <label className="block mb-1">อำเภอ/เขต</label>
          <Select
            key={`dist-sel-${resetKey}-${effectiveProvince}`}
            value={currentDistrict || ""}
            onValueChange={handleDistrictChange}
            disabled={loading || derivedDistricts.length === 0}
          >
            <SelectTrigger className="h-11 cursor-pointer">
              <SelectValue
                placeholder={
                  derivedDistricts.length
                    ? "เลือกอำเภอ/เขต"
                    : "เลือกจังหวัดก่อน"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {derivedDistricts.map((d) => (
                <SelectItem
                  key={d.id}
                  value={d.name_th}
                  className="cursor-pointer"
                >
                  {d.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.District && (
            <p className="text-red-500 text-sm mt-1">
              {errors.District.message}
            </p>
          )}
        </div>

        {/* Subdistrict */}
        <div>
          <label className="block mb-1">ตำบล/แขวง</label>
          <Select
            key={`subdist-sel-${resetKey}-${currentDistrict}`}
            value={form.watch("Subdistrict") || ""}
            onValueChange={(v) =>
              form.setValue("Subdistrict", v, {
                shouldDirty: true,
                shouldValidate: true,
              })
            }
            disabled={loading || derivedSubDistricts.length === 0}
          >
            <SelectTrigger className="h-11 cursor-pointer">
              <SelectValue
                placeholder={
                  derivedSubDistricts.length
                    ? "เลือกตำบล/แขวง"
                    : "เลือกอำเภอก่อน"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {derivedSubDistricts.map((sd) => (
                <SelectItem
                  key={sd.id}
                  value={sd.name_th}
                  className="cursor-pointer"
                >
                  {sd.name_th}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors?.Subdistrict && (
            <p className="text-red-500 text-sm mt-1">
              {errors.Subdistrict.message}
            </p>
          )}
        </div>

        {/* Address (ตาม postLocation ใช้ input ธรรมดา) */}
        <div className="md:col-span-2">
          <label className="block mb-1">ที่อยู่</label>
          <Controller
            name="Address"
            control={form.control}
            defaultValue=""
            render={({ field }) => (
              <Input
                key={`addr-${resetKey}`}
                placeholder="เลขที่/หมู่/ตรอก/ซอย/ถนน/รหัสไปรษณีย์"
                {...field}
                value={field.value ?? ""}
                onBlur={(e) => {
                  const v = (e.target.value || "").trim();
                  form.setValue("Address", v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  field.onBlur();
                }}
              />
            )}
          />
          {errors?.Address && (
            <p className="text-red-500 text-sm mt-1">
              {errors.Address.message}
            </p>
          )}
        </div>

        {/* LinkMap */}
        <div className="md:col-span-2">
          <label className="block mb-1">ลิงก์แผนที่ (Google Maps/ฯลฯ)</label>
          <Controller
            name="LinkMap"
            control={form.control}
            defaultValue=""
            render={({ field }) => (
              <Input
                key={`linkmap-${resetKey}`}
                type="url"
                placeholder="https://maps.app.goo.gl/..."
                {...field}
                value={field.value ?? ""}
                onBlur={(e) => {
                  const v = (e.target.value || "").trim();
                  form.setValue("LinkMap", v, {
                    shouldDirty: true,
                    shouldValidate: true,
                  });
                  field.onBlur();
                }}
              />
            )}
          />
          {errors?.LinkMap && (
            <p className="text-red-500 text-sm mt-1">
              {errors.LinkMap.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
