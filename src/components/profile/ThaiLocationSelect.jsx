// src/components/profile/ThaiLocationSelect.jsx
import React, { useEffect, useMemo, useState } from "react";

/**
 * Props:
 * - provinceValue, districtValue, subDistrictValue: string (ชื่อภาษาไทย)
 * - onProvinceChange(v), onDistrictChange(v), onSubDistrictChange(v)
 * - showSubDistrict: boolean
 * - disabled: boolean
 * - provinceWhitelist: string[] (รายชื่อจังหวัดภาษาไทยที่ให้เลือก)
 */
export default function ThaiLocationSelect({
  provinceValue,
  districtValue,
  subDistrictValue,
  onProvinceChange,
  onDistrictChange,
  onSubDistrictChange,
  showSubDistrict = false,
  disabled = false,
  provinceWhitelist,
}) {
  // raw data
  const [provinces, setProvinces] = useState([]); // [{id, name_th}, ...]
  const [districts, setDistricts] = useState([]); // [{id, name_th, province_id}, ...]
  const [subDistricts, setSubDistricts] = useState([]); // [{id, name_th, district_id}, ...]

  // derived options for selects
  const [districtOptions, setDistrictOptions] = useState([]); // [{id, name_th}]
  const [subDistrictOptions, setSubDistrictOptions] = useState([]); // [{id, name_th}]

  const collatorTH = useMemo(() => new Intl.Collator("th"), []);

  // ปรับ whitelist ให้สะอาด: trim + เดดัพ
  const normalizedWhitelist = useMemo(() => {
    if (!Array.isArray(provinceWhitelist) || provinceWhitelist.length === 0)
      return null;
    const set = new Set(
      provinceWhitelist
        .map((s) => String(s ?? "").trim())
        .filter((s) => s.length > 0)
    );
    return Array.from(set);
  }, [provinceWhitelist]);

  // 1) โหลด provinces/districts/sub_districts (ตาม whitelist)
  useEffect(() => {
    const ac = new AbortController();

    const fetchAll = async () => {
      try {
        const [pRes, dRes, sRes] = await Promise.all([
          fetch(
            "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/province.json",
            { signal: ac.signal }
          ),
          fetch(
            "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/district.json",
            { signal: ac.signal }
          ),
          fetch(
            "https://raw.githubusercontent.com/kongvut/thai-province-data/refs/heads/master/api/latest/sub_district.json",
            { signal: ac.signal }
          ),
        ]);

        const [p, d, s] = await Promise.all([
          pRes.json(),
          dRes.json(),
          sRes.json(),
        ]);

        // provinces: กรองด้วย whitelist ถ้ามี
        const pFiltered =
          normalizedWhitelist && normalizedWhitelist.length
            ? p.filter((x) =>
                normalizedWhitelist.includes(String(x.name_th).trim())
              )
            : p;

        setProvinces(pFiltered);
        setDistricts(d);
        setSubDistricts(s);
      } catch (err) {
        if (err?.name !== "AbortError") {
          console.error("โหลดข้อมูลจังหวัด/อำเภอ/ตำบลไม่สำเร็จ:", err);
        }
      }
    };

    fetchAll();
    return () => ac.abort();
  }, [normalizedWhitelist]);

  // helper: map ชื่อจังหวัด → id (เทียบด้วยชื่อไทยที่ trim แล้ว)
  const provinceNameToId = useMemo(() => {
    const m = new Map();
    provinces.forEach((p) => m.set(String(p.name_th).trim(), p.id));
    return m;
  }, [provinces]);

  // helper: map ชื่ออำเภอ → id
  const districtNameToId = useMemo(() => {
    const m = new Map();
    districts.forEach((d) => m.set(String(d.name_th).trim(), d.id));
    return m;
  }, [districts]);

  // ถ้า whitelist เปลี่ยนจน provinceValue ปัจจุบัน “หายไป” → เคลียร์ค่า + sync ให้ parent
  useEffect(() => {
    if (!provinceValue) return;
    const has = provinceNameToId.has(String(provinceValue).trim());
    if (!has) {
      onProvinceChange?.("");
      onDistrictChange?.("");
      onSubDistrictChange?.("");
      setDistrictOptions([]);
      setSubDistrictOptions([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [provinceNameToId]);

  // 2) เมื่อเลือก "จังหวัด" → คำนวณอำเภอที่อยู่ใต้จังหวัดนั้นจาก province_id
  useEffect(() => {
    const pid = provinceNameToId.get(String(provinceValue || "").trim());
    if (!pid) {
      setDistrictOptions([]);
      setSubDistrictOptions([]);
      return;
    }
    const ds = districts
      .filter((d) => d.province_id === pid)
      .map((d) => ({ id: d.id, name_th: d.name_th }))
      .sort((a, b) => collatorTH.compare(a.name_th, b.name_th));
    setDistrictOptions(ds);
  }, [provinceValue, provinceNameToId, districts, collatorTH]);

  // 3) เมื่อเลือก "อำเภอ" → คำนวณตำบลจาก district_id
  useEffect(() => {
    const did = districtNameToId.get(String(districtValue || "").trim());
    if (!did) {
      setSubDistrictOptions([]);
      return;
    }
    const subs = subDistricts
      .filter((s) => s.district_id === did)
      .map((s) => ({ id: s.id, name_th: s.name_th }))
      .sort((a, b) => collatorTH.compare(a.name_th, b.name_th));
    setSubDistrictOptions(subs);
  }, [districtValue, districtNameToId, subDistricts, collatorTH]);

  // รายการจังหวัด (ชื่อไทย)
  const provinceOptions = useMemo(() => {
    // เดดัพชื่อจังหวัด (กันข้อมูลซ้ำ)
    const set = new Set(provinces.map((p) => String(p.name_th).trim()));
    return Array.from(set).sort(collatorTH.compare);
  }, [provinces, collatorTH]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:col-span-2">
      {/* จังหวัด */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">จังหวัด</label>
        <select
          value={provinceValue || ""}
          onChange={(e) => onProvinceChange?.(e.target.value.trim())}
          disabled={disabled}
          className="w-full rounded border px-3 py-2"
        >
          <option value="">-</option>
          {provinceOptions.map((name) => (
            <option key={name} value={name}>
              {name}
            </option>
          ))}
        </select>
      </div>

      {/* อำเภอ/เขต */}
      <div>
        <label className="block text-sm text-gray-600 mb-1">อำเภอ/เขต</label>
        <select
          value={districtValue || ""}
          onChange={(e) => onDistrictChange?.(e.target.value.trim())}
          disabled={disabled || !provinceValue || districtOptions.length === 0}
          className="w-full rounded border px-3 py-2"
        >
          <option value="">-</option>
          {districtOptions.map((d) => (
            <option key={d.id} value={d.name_th}>
              {d.name_th}
            </option>
          ))}
        </select>
      </div>

      {/* ตำบล/แขวง */}
      {showSubDistrict && (
        <div>
          <label className="block text-sm text-gray-600 mb-1">ตำบล/แขวง</label>
          <select
            value={subDistrictValue || ""}
            onChange={(e) => onSubDistrictChange?.(e.target.value.trim())}
            disabled={
              disabled || !districtValue || subDistrictOptions.length === 0
            }
            className="w-full rounded border px-3 py-2"
          >
            <option value="">-</option>
            {subDistrictOptions.map((s) => (
              <option key={s.id} value={s.name_th}>
                {s.name_th}
              </option>
            ))}
          </select>
        </div>
      )}
    </div>
  );
}
