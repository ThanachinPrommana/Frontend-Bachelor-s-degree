import React, { useEffect, useState } from "react";
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

/** ===== New latest endpoints ===== */
const PROVINCE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province.json";
const DISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/district.json";
const SUBDISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district.json";

const PostLocation = () => {
  const navigate = useNavigate();
  const form = useFormContext();

  /** master lists */
  const [provinces, setProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);
  const [allSubDistricts, setAllSubDistricts] = useState([]);

  /** filtered lists for current selection */
  const [districts, setDistricts] = useState([]);
  const [subDistricts, setSubDistricts] = useState([]);

  /** loading flags */
  const [loading, setLoading] = useState(true);

  // โหลด master ทั้งหมดครั้งเดียว
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        setLoading(true);
        const [provRes, distRes, subRes] = await Promise.all([
          fetch(PROVINCE_URL),
          fetch(DISTRICT_URL),
          fetch(SUBDISTRICT_URL),
        ]);
        const [prov, dist, sub] = await Promise.all([
          provRes.json(),
          distRes.json(),
          subRes.json(),
        ]);
        if (!mounted) return;

        setProvinces(prov || []);
        setAllDistricts(dist || []);
        setAllSubDistricts(sub || []);
      } catch (err) {
        console.error("โหลดจังหวัด/อำเภอ/ตำบล (latest) ไม่สำเร็จ:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // เมื่อ master พร้อมแล้ว → เติมค่าอำเภอ/ตำบลตามค่าที่เคยเลือกไว้ (ถ้ามี)
  useEffect(() => {
    if (loading) return;

    const currentProvince = form.getValues("Province");
    const currentDistrict = form.getValues("District");

    if (currentProvince) {
      const p = provinces.find((x) => x.name_th === currentProvince);
      const ds = p
        ? allDistricts.filter((d) => String(d.province_id) === String(p.id))
        : [];
      setDistricts(ds);

      if (currentDistrict) {
        const d = ds.find((x) => x.name_th === currentDistrict);
        const subs = d
          ? allSubDistricts.filter(
              (sd) => String(sd.district_id) === String(d.id)
            )
          : [];
        setSubDistricts(subs);

        if (!d) {
          // district เดิมไม่ match กับจังหวัดนี้แล้ว → รีเซ็ต
          form.resetField("District");
          form.resetField("Subdistrict");
          setSubDistricts([]);
        }
      } else {
        setSubDistricts([]);
        form.resetField("Subdistrict");
      }
    } else {
      setDistricts([]);
      setSubDistricts([]);
      form.resetField("District");
      form.resetField("Subdistrict");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, provinces, allDistricts, allSubDistricts]);

  /** province changed */
  const handleProvinceChange = (provinceName) => {
    form.setValue("Province", provinceName, { shouldDirty: true });

    // reset หลังเลือกจังหวัด
    form.resetField("District");
    form.resetField("Subdistrict");

    const p = provinces.find((x) => x.name_th === provinceName);
    const ds = p
      ? allDistricts.filter((d) => String(d.province_id) === String(p.id))
      : [];
    setDistricts(ds);
    setSubDistricts([]);
  };

  /** district changed */
  const handleDistrictChange = (districtName) => {
    form.setValue("District", districtName, { shouldDirty: true });
    form.resetField("Subdistrict");

    const d = allDistricts.find((x) => x.name_th === districtName);
    const subs = d
      ? allSubDistricts.filter((sd) => String(sd.district_id) === String(d.id))
      : [];
    setSubDistricts(subs);
  };

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
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              {/* จังหวัด */}
              <FormField
                control={form.control}
                name="Province"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>จังหวัด</FormLabel>
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
                        {provinces.map((prov) => (
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
                      disabled={loading || districts.length === 0}
                    >
                      <SelectTrigger className="h-11 cursor-pointer">
                        <SelectValue
                          placeholder={
                            districts.length
                              ? "เลือกอำเภอ/เขต"
                              : "เลือกจังหวัดก่อน"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
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
                      disabled={loading || subDistricts.length === 0}
                    >
                      <SelectTrigger className="h-11 cursor-pointer">
                        <SelectValue
                          placeholder={
                            subDistricts.length
                              ? "เลือกตำบล/แขวง"
                              : "เลือกอำเภอก่อน"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {subDistricts.map((sd) => (
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
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ที่อยู่</FormLabel>
                    <Input
                      placeholder="เลขที่/หมู่ที่/ตรอก/ซอย/ถนน/รหัสไปรษณีย์"
                      {...field}
                      className="w-full rounded border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Google Map */}
              <FormField
                control={form.control}
                name="LinkMap"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>ลิงก์ Google Map (ถ้ามี)</FormLabel>
                    <input
                      type="url"
                      placeholder="https://maps.google.com/..."
                      {...field}
                      className="w-full rounded border border-input bg-background px-3 py-2 focus:outline-none focus:ring-2 focus:ring-primary"
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

export default PostLocation;
