import { useEffect, useMemo, useState } from "react";

/**
 * ThaiLocationSelect (updated to latest API)
 * - ใช้ province.json, district.json, sub_district.json (ชุด latest)
 * - props ที่รองรับ (เหมือนเดิม + optional subdistrict):
 *    provinceValue, districtValue, subDistrictValue
 *    onProvinceChange(val), onDistrictChange(val), onSubDistrictChange(val)
 *    showSubDistrict = false   ← ถ้า true จะแสดงช่องตำบล/แขวง
 *
 * หมายเหตุโครงสร้างไฟล์ API:
 * - province:      { id, name_th, name_en, geography_id }
 * - district:      { id, name_th, name_en, province_id }
 * - sub_district:  { id, name_th, name_en, district_id, zipcode }
 */

const PROVINCE_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province.json";
const DISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/district.json";
const SUBDISTRICT_URL =
  "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district.json";

export default function ThaiLocationSelect({
  provinceValue = "",
  districtValue = "",
  subDistrictValue = "",
  onProvinceChange,
  onDistrictChange,
  onSubDistrictChange,
  showSubDistrict = false,
}) {
  const [provinces, setProvinces] = useState([]);
  const [allDistricts, setAllDistricts] = useState([]); // cache ทั้งประเทศ
  const [allSubDistricts, setAllSubDistricts] = useState([]); // cache ทั้งประเทศ

  const [loadingP, setLoadingP] = useState(true);
  const [loadingD, setLoadingD] = useState(false);
  const [loadingS, setLoadingS] = useState(false);

  // โหลดจังหวัดครั้งเดียว
  useEffect(() => {
    (async () => {
      try {
        setLoadingP(true);
        const res = await fetch(PROVINCE_URL);
        const data = await res.json();
        setProvinces(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("โหลดจังหวัดไม่สำเร็จ:", e);
        setProvinces([]);
      } finally {
        setLoadingP(false);
      }
    })();
  }, []);

  // helper หา province object จากชื่อ
  const selectedProvince = useMemo(() => {
    if (!provinceValue || provinces.length === 0) return null;
    return (
      provinces.find(
        (p) =>
          p.name_th === provinceValue ||
          p.name_en === provinceValue ||
          String(p.id) === String(provinceValue) // รองรับเคส dev ส่ง id มาก็ได้
      ) || null
    );
  }, [provinceValue, provinces]);

  // โหลด district ทั้งประเทศครั้งเดียวเมื่อจำเป็น
  useEffect(() => {
    if (!selectedProvince) return; // ยังไม่เลือกจังหวัด ไม่ต้องรีบโหลด
    if (allDistricts.length > 0) return; // เคยโหลดแล้ว

    (async () => {
      try {
        setLoadingD(true);
        const res = await fetch(DISTRICT_URL);
        const data = await res.json();
        setAllDistricts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("โหลดอำเภอ/เขตไม่สำเร็จ:", e);
        setAllDistricts([]);
      } finally {
        setLoadingD(false);
      }
    })();
  }, [selectedProvince, allDistricts.length]);

  // filter district ตามจังหวัดที่เลือก
  const districts = useMemo(() => {
    if (!selectedProvince || allDistricts.length === 0) return [];
    return allDistricts.filter(
      (d) => String(d.province_id) === String(selectedProvince.id)
    );
  }, [selectedProvince, allDistricts]);

  // โหลด sub_district ทั้งประเทศเมื่อจำเป็น (เฉพาะกรณีให้แสดง)
  useEffect(() => {
    if (!showSubDistrict) return;
    if (!districtValue) return;
    if (allSubDistricts.length > 0) return;

    (async () => {
      try {
        setLoadingS(true);
        const res = await fetch(SUBDISTRICT_URL);
        const data = await res.json();
        setAllSubDistricts(Array.isArray(data) ? data : []);
      } catch (e) {
        console.error("โหลดตำบล/แขวงไม่สำเร็จ:", e);
        setAllSubDistricts([]);
      } finally {
        setLoadingS(false);
      }
    })();
  }, [showSubDistrict, districtValue, allSubDistricts.length]);

  // หา district object ที่เลือก (ใช้ตอน filter sub_district)
  const selectedDistrict = useMemo(() => {
    if (!districtValue || districts.length === 0) return null;
    return (
      districts.find(
        (d) =>
          d.name_th === districtValue ||
          d.name_en === districtValue ||
          String(d.id) === String(districtValue)
      ) || null
    );
  }, [districtValue, districts]);

  const subDistricts = useMemo(() => {
    if (!showSubDistrict) return [];
    if (!selectedDistrict || allSubDistricts.length === 0) return [];
    return allSubDistricts.filter(
      (s) => String(s.district_id) === String(selectedDistrict.id)
    );
  }, [showSubDistrict, selectedDistrict, allSubDistricts]);

  return (
    <>
      {/* จังหวัด */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          จังหวัดที่ต้องการ
        </label>
        <select
          value={provinceValue}
          onChange={(e) => {
            const val = e.target.value;
            onProvinceChange?.(val);
            // reset child
            onDistrictChange?.("");
            if (showSubDistrict) onSubDistrictChange?.("");
          }}
          className="w-full border rounded-md p-2 disabled:bg-gray-100"
          disabled={loadingP}
        >
          <option value="">
            {loadingP ? "กำลังโหลดจังหวัด..." : "เลือกจังหวัด"}
          </option>
          {provinces.map((p) => (
            <option key={p.id} value={p.name_th}>
              {p.name_th}
            </option>
          ))}
        </select>
      </div>

      {/* อำเภอ/เขต */}
      <div>
        <label className="block mb-1 text-sm font-medium text-gray-700">
          อำเภอ/เขตที่ต้องการ
        </label>
        <select
          value={districtValue}
          onChange={(e) => {
            const val = e.target.value;
            onDistrictChange?.(val);
            if (showSubDistrict) onSubDistrictChange?.("");
          }}
          className="w-full border rounded-md p-2 disabled:bg-gray-100"
          disabled={loadingD || !selectedProvince}
        >
          <option value="">
            {loadingD ? "กำลังโหลดอำเภอ..." : "เลือกอำเภอ/เขต"}
          </option>
          {districts.map((d) => (
            <option key={d.id} value={d.name_th}>
              {d.name_th}
            </option>
          ))}
        </select>
      </div>

      {/* ตำบล/แขวง (optional) */}
      {showSubDistrict && (
        <div className="col-span-2">
          <label className="block mb-1 text-sm font-medium text-gray-700">
            ตำบล/แขวง
          </label>
          <select
            value={subDistrictValue}
            onChange={(e) => onSubDistrictChange?.(e.target.value)}
            className="w-full border rounded-md p-2 disabled:bg-gray-100"
            disabled={loadingS || !selectedDistrict}
          >
            <option value="">
              {loadingS ? "กำลังโหลดตำบล..." : "เลือกตำบล/แขวง"}
            </option>
            {subDistricts.map((s) => (
              <option key={s.id} value={s.name_th}>
                {s.name_th}
              </option>
            ))}
          </select>
        </div>
      )}
    </>
  );
}
