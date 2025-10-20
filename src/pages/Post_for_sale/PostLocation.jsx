import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PostLayout from "@/layouts/PostLayout";
import { MapPin, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { postLocationSchema } from "@/components/schemas/postSchemas/postLocationSchema";
import { validateStep } from "@/lib/zodRHF";
import { Input } from "@/components/ui/input";

/** Latest endpoints */
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

/** helpers: normalize + safe equal */
const norm = (s) => String(s ?? "").trim();
const safeEq = (a, b) => norm(a) === norm(b);
const isAllowedProvince = (p) => ALLOWED_PROVINCES.map(norm).includes(norm(p));

const PostLocation = () => {
  const navigate = useNavigate();
  const form = useFormContext();

  /** master lists */
  const [provinces, setProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSubDistricts, setAllSubDistricts] = useState([]);

  /** index maps for O(1) lookup */
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

  /** provinces ที่อนุญาตเท่านั้นสำหรับ dropdown */
  const allowedProvinceList = useMemo(
    () => provinces.filter((p) => isAllowedProvince(p.name_th)),
    [provinces]
  );

  /** loading flags */
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
          console.error("โหลดจังหวัด/อำเภอ/ตำบลไม่สำเร็จ:", err);
      } finally {
        setLoading(false);
      }
    })();

    return () => controller.abort();
  }, []);

  /** ===== Derived lists จากค่าปัจจุบันของฟอร์ม (ไม่มี state ซ้ำซ้อน) ===== */
  const currentProvince = form.watch("Province");
  const currentDistrict = form.watch("District");

  // ถ้า province ไม่อยู่ใน allowed (เช่น เคยกรอกเก่า/มี space เพี้ยน) จะ treat เป็นว่าง
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

  /** ===== onChange handlers ===== */
  const handleProvinceChange = (provinceName) => {
    if (!isAllowedProvince(provinceName)) return;
    form.setValue("Province", provinceName, { shouldDirty: true });
    // เคลียร์ dependent fields
    form.resetField("District");
    form.resetField("Subdistrict");
  };

  const handleDistrictChange = (districtName) => {
    form.setValue("District", districtName, { shouldDirty: true });
    form.resetField("Subdistrict");
  };

  /** submit */
  const onSubmit = () => {
    const ok = validateStep(form, postLocationSchema, [
      "Province",
      "District",
      "Subdistrict",
      "Address",
      "LinkMap",
    ]);
    if (!ok) return;
    navigate("/seller/post-for-sale/detail");
  };

  const disableNext = loading;

  return (
    <PostLayout currentStep={1}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardContent className="py-8 px-6 md:px-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <MapPin className="mx-auto w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold mt-1">
                ระบุตำแหน่งที่ตั้ง
              </h2>
              <p className="text-muted-foreground text-sm">
                เลือกจังหวัด อำเภอ และตำบลเพื่อช่วยให้ผู้ซื้อค้นหาได้ง่าย
              </p>
            </div>

            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                เมื่อเปลี่ยน <span className="font-medium">จังหวัด</span>{" "}
                ระบบจะรีเซ็ตอำเภอและตำบลอัตโนมัติ หากย้อนกลับมา
                หน้าจะเติมอำเภอ/ตำบลเดิมให้โดยอัตโนมัติ
                (ถ้าสอดคล้องกับจังหวัดที่เลือก)
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-6"
              noValidate
            >
              {/* จังหวัด */}
              <FormField
                control={form.control}
                name="Province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จังหวัด</FormLabel>
                    <p className="text-xs text-muted-foreground mb-2">
                      ระบบรองรับเฉพาะ{" "}
                      <span className="font-medium">
                        กรุงเทพมหานคร และปริมณฑล
                      </span>{" "}
                      (นนทบุรี, ปทุมธานี, สมุทรปราการ, สมุทรสาคร, นครปฐม)
                    </p>

                    <Select
                      value={field.value || ""}
                      onValueChange={handleProvinceChange}
                      disabled={loading}
                    >
                      <SelectTrigger className="h-11 cursor-pointer">
                        <SelectValue
                          placeholder={
                            loading ? "กำลังโหลด..." : "เลือกจังหวัด"
                          }
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* อำเภอ/เขต */}
              <FormField
                control={form.control}
                name="District"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อำเภอ/เขต</FormLabel>
                    <Select
                      value={field.value || ""}
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ตำบล/แขวง */}
              <FormField
                control={form.control}
                name="Subdistrict"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ตำบล/แขวง</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={(v) =>
                        form.setValue("Subdistrict", v, { shouldDirty: true })
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
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ที่อยู่ */}
              <FormField
                control={form.control}
                name="Address"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>ที่อยู่</FormLabel>
                    <Input
                      {...field}
                      placeholder="เลขที่/หมู่ที่/ตรอก/ซอย/ถนน/รหัสไปรษณีย์"
                      className="w-full rounded border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-invalid={!!fieldState.error}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        form.setValue("Address", v, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        field.onBlur();
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Google Map */}
              <FormField
                control={form.control}
                name="LinkMap"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel>ลิงก์ Google Map (ถ้ามี)</FormLabel>
                    <input
                      type="url"
                      {...field}
                      placeholder="https://maps.google.com/..."
                      className="w-full rounded border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                      aria-invalid={!!fieldState.error}
                      onBlur={(e) => {
                        const v = e.target.value.trim();
                        form.setValue("LinkMap", v, {
                          shouldValidate: true,
                          shouldDirty: true,
                        });
                        field.onBlur();
                      }}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Navigation */}
              <div className="flex justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/seller/post-for-sale/title")}
                >
                  ย้อนกลับ
                </Button>
                <Button
                  type="submit"
                  className="min-w-[120px]"
                  disabled={disableNext}
                >
                  {disableNext ? "กำลังโหลด..." : "ถัดไป"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </PostLayout>
  );
};

export default PostLocation;
