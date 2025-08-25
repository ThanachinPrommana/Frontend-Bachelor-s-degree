import React, { useEffect, useMemo, useState } from "react";
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

const PROVINCE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_province.json";
const AMPHURE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_amphure.json";
const TAMBON_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/master/api_tambon.json";

const PostLocation = () => {
  const navigate = useNavigate();
  const form = useFormContext();

  // master lists
  const [provinces, setProvinces] = useState([]);
  const [allAmphures, setAllAmphures] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]);

  // derived lists (ตาม province/district ที่เลือก)
  const [amphures, setAmphures] = useState([]);
  const [districts, setDistricts] = useState([]);

  const [loading, setLoading] = useState(true);

  // โหลดข้อมูลทั้งสามรายการครั้งเดียว (เร็วและทำให้ hydrate ง่าย)
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const [provRes, ampRes, disRes] = await Promise.all([
          fetch(PROVINCE_URL),
          fetch(AMPHURE_URL),
          fetch(TAMBON_URL),
        ]);
        const [prov, amp, dis] = await Promise.all([
          provRes.json(),
          ampRes.json(),
          disRes.json(),
        ]);
        if (!mounted) return;
        setProvinces(prov);
        setAllAmphures(amp);
        setAllDistricts(dis);
      } catch (err) {
        console.error("โหลดข้อมูลจังหวัด/อำเภอ/ตำบล error:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // ------- HYDRATE ค่าที่มีอยู่ในฟอร์ม เมื่อเปิดหน้า/ย้อนกลับมา -------
  useEffect(() => {
    if (loading) return;
    const currentProvince = form.getValues("Province");
    const currentDistrict = form.getValues("District");

    // ถ้ามี province ในฟอร์ม -> คำนวณอำเภอที่ตรงจังหวัดนั้น
    if (currentProvince) {
      const p = provinces.find((x) => x.name_th === currentProvince);
      const amps = p
        ? allAmphures.filter((a) => String(a.province_id) === String(p.id))
        : [];
      setAmphures(amps);

      // ถ้ามี district อยู่แล้ว -> เติมรายการตำบลของอำเภอนั้น
      if (currentDistrict) {
        const amp = amps.find((a) => a.name_th === currentDistrict);
        const dists = amp
          ? allDistricts.filter((d) => String(d.amphure_id) === String(amp.id))
          : [];
        setDistricts(dists);

        // ถ้า district เดิมไม่อยู่ในจังหวัดนี้แล้ว -> เคลียร์
        if (!amp) {
          form.resetField("District");
          form.resetField("Subdistrict");
          setDistricts([]);
        }
      } else {
        // ไม่มี district เดิม -> เคลียร์ตำบลไว้ก่อน
        setDistricts([]);
        form.resetField("Subdistrict");
      }
    } else {
      // ไม่มี province -> เคลียร์ลิสต์ย่อย
      setAmphures([]);
      setDistricts([]);
      form.resetField("District");
      form.resetField("Subdistrict");
    }
  }, [loading, provinces, allAmphures, allDistricts]); // รันเมื่อโหลด master เสร็จ

  // --------- handler ตอน "ผู้ใช้เปลี่ยน" จังหวัด/อำเภอ ในหน้านี้ ----------
  const handleProvinceChange = (provinceName) => {
    // อัปเดตค่าในฟอร์ม
    form.setValue("Province", provinceName, { shouldDirty: true });

    // reset ฟิลด์ลูก
    form.resetField("District");
    form.resetField("Subdistrict");

    // คำนวณอำเภอตามจังหวัดใหม่
    const p = provinces.find((x) => x.name_th === provinceName);
    const amps = p
      ? allAmphures.filter((a) => String(a.province_id) === String(p.id))
      : [];
    setAmphures(amps);
    setDistricts([]);
  };

  const handleDistrictChange = (districtName) => {
    form.setValue("District", districtName, { shouldDirty: true });
    form.resetField("Subdistrict");

    const amp = allAmphures.find((a) => a.name_th === districtName);
    const dists = amp
      ? allDistricts.filter((d) => String(d.amphure_id) === String(amp.id))
      : [];
    setDistricts(dists);
  };

  const onSubmit = () => {
    const ok = validateStep(form, postLocationSchema, [
      "Province",
      "District",
      "Subdistrict",
      "LinkMap",
      "Latitude",
      "Longitude",
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
                ระบบจะรีเซ็ตอำเภอและตำบล อัตโนมัติ หากย้อนกลับมา
                หน้าจะเติมอำเภอ/ตำบลเดิมให้โดยอัตโนมัติ
                (ถ้ายังสอดคล้องกับจังหวัดที่เลือก)
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
                      <SelectTrigger className="h-11">
                        <SelectValue
                          placeholder={
                            loading ? "กำลังโหลด..." : "เลือกจังหวัด"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {provinces.map((prov) => (
                          <SelectItem key={prov.id} value={prov.name_th}>
                            {prov.name_th}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* อำเภอ */}
              <FormField
                control={form.control}
                name="District"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>อำเภอ/เขต</FormLabel>
                    <Select
                      value={field.value || ""}
                      onValueChange={handleDistrictChange}
                      disabled={amphures.length === 0}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue
                          placeholder={
                            amphures.length
                              ? "เลือกอำเภอ/เขต"
                              : "เลือกจังหวัดก่อน"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {amphures.map((a) => (
                          <SelectItem key={a.id} value={a.name_th}>
                            {a.name_th}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* ตำบล */}
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
                      disabled={districts.length === 0}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue
                          placeholder={
                            districts.length
                              ? "เลือกตำบล/แขวง"
                              : "เลือกอำเภอก่อน"
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {districts.map((d) => (
                          <SelectItem key={d.id} value={d.name_th}>
                            {d.name_th}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
