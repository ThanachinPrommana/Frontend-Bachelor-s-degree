// src/components/PostComponents/EditPostDialog/steps/PriceStep.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

/* ---------- presets & mapping ---------- */
const RECURRING_EXPENSE_PRESETS = {
  บ้านเดี่ยว: [
    "ค่าส่วนกลางหมู่บ้าน",
    "ค่าบำรุงถนน/ไฟสาธารณะ",
    "ค่าดูแลสวนส่วนกลาง",
    "ค่ากำจัดปลวกหรือแมลงประจำปี",
    "ค่าซ่อมบำรุงระบบไฟ/น้ำ",
    "ค่าที่จอดรถนอกตัวบ้าน",
  ],
  ทาวน์เฮาส์: [
    "ค่าส่วนกลางหมู่บ้าน",
    "ค่าบำรุงถนน/ไฟสาธารณะ",
    "ค่าดูแลสวนส่วนกลาง",
    "ค่ากำจัดปลวกหรือแมลงประจำปี",
    "ค่าซ่อมบำรุงระบบไฟ/น้ำ",
    "ค่าที่จอดรถนอกตัวบ้าน",
  ],
  คอนโดมิเนียม: [
    "ค่าส่วนกลาง",
    "ค่าเช่าที่จอดรถรายเดือน",
    "ค่าบริการอินเทอร์เน็ต/เคเบิล/ทีวี",
    "ค่าสมาชิกฟิตเนส/สระว่ายน้ำ",
  ],
  วิลล่า: [
    "ค่าส่วนกลาง",
    "ค่าดูแลสระว่ายน้ำ",
    "ค่าดูแลสวน/ภูมิทัศน์รอบบ้าน",
    "ค่ากำจัดปลวกหรือแมลง",
    "ค่าบริการคลับเฮาส์/สปอร์ตคลับ",
  ],
};

const CATEGORY_LABEL_BY_ID = {
  cmegzfhx70007w2bwp63cbc1w: "บ้านเดี่ยว",
  cmegzft08000aw2bwx91l68z9: "ทาวน์เฮาส์",
  cmegzfdya0006w2bwq5d8alc7: "คอนโดมิเนียม",
  cmegzfov30009w2bwrxjpt7xn: "วิลล่า",
};
const CATEGORY_LABEL_ALIAS = { เทาวน์เฮาส์: "ทาวน์เฮาส์" };

/* ---------- number-format helpers ---------- */
const nfTH = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});
const nfBaht2 = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const sanitizeNumericText = (s) => {
  if (s == null) return "";
  let t = String(s).replace(/[^0-9.]/g, "");
  const firstDot = t.indexOf(".");
  if (firstDot !== -1) {
    const head = t.slice(0, firstDot + 1);
    const tail = t.slice(firstDot + 1).replace(/\./g, "");
    t = head + tail;
  }
  return t;
};
const textToNumber = (t) => {
  if (!t || t === ".") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
};
const formatWithGrouping = (t) => {
  if (t == null || t === "") return "";
  const [intPart, fracPart] = String(t).split(".");
  const intNum = intPart === "" ? "" : nfTH.format(Number(intPart));
  return fracPart != null ? `${intNum}.${fracPart}` : intNum;
};
const digitsRightCount = (str, cursor) => {
  let cnt = 0;
  for (let i = cursor; i < str.length; i++) if (/[0-9]/.test(str[i])) cnt++;
  return cnt;
};
const caretFromDigitsRight = (str, digitsRight) => {
  for (let i = str.length; i >= 0; i--) {
    if (digitsRightCount(str, i) === digitsRight) return i;
  }
  return str.length;
};

/* ---------- logic helpers ---------- */
const toNum = (v) => (v === "" || v == null ? undefined : Number(v));
const clamp = (n, min, max) =>
  Number.isFinite(n) ? Math.min(Math.max(n, min), max) : n;
const round2 = (n) => Math.round(n * 100) / 100;
const computeDepositAmount = (price, percent) => {
  const p = Number(price);
  const pc = Number(percent);
  if (!Number.isFinite(p) || !Number.isFinite(pc)) return 0;
  return round2(p * (pc / 100));
};

export default function PriceStep({
  errors,
  sellRentLocked,
  formatBaht,
  resetKey,
}) {
  const { control, watch, setValue, getValues } = useFormContext();

  // ----- อ่าน category → หา preset รายจ่าย -----
  const rawCategoryId = useWatch({ control, name: "categoryId" });
  let categoryLabel = CATEGORY_LABEL_BY_ID[rawCategoryId] || "";
  if (CATEGORY_LABEL_ALIAS[categoryLabel])
    categoryLabel = CATEGORY_LABEL_ALIAS[categoryLabel];

  const allowedOptions = useMemo(
    () => RECURRING_EXPENSE_PRESETS[categoryLabel] || [],
    [categoryLabel]
  );

  // ทำความสะอาด options เมื่อหมวดเปลี่ยน
  useEffect(() => {
    const cur = getValues("Other_related_expenses") || [];
    if (!Array.isArray(cur)) {
      setValue("Other_related_expenses", [], {
        shouldDirty: true,
        shouldValidate: false,
      });
      return;
    }
    const filtered = cur.filter((x) => allowedOptions.includes(x));
    if (filtered.length !== cur.length) {
      setValue("Other_related_expenses", filtered, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [allowedOptions, getValues, setValue]);

  // ----- ราคาแบบมีคอมม่า -----
  const priceInputRef = useRef(null);
  const [priceDisplay, setPriceDisplay] = useState("");

  // sync จากค่าในฟอร์ม -> UI string
  const priceVal = useWatch({ control, name: "Price" });
  useEffect(() => {
    if (priceVal == null || priceVal === "") setPriceDisplay("");
    else {
      const raw = String(priceVal);
      const [i, f] = raw.split(".");
      const formatted =
        nfTH.format(Number(i ?? 0)) + (f != null ? `.${f}` : "");
      setPriceDisplay(formatted);
    }
  }, [priceVal]);

  const handlePriceChange = (e, fieldOnChange) => {
    const inputEl = priceInputRef.current;
    const rawStr = e.target.value;
    const prevCursor = inputEl?.selectionStart ?? rawStr.length;
    const rightDigits = digitsRightCount(rawStr, prevCursor);

    const cleaned = sanitizeNumericText(rawStr);
    const asNumber = textToNumber(cleaned);
    fieldOnChange(asNumber);

    const display = formatWithGrouping(cleaned);
    setPriceDisplay(display);

    requestAnimationFrame(() => {
      const el = priceInputRef.current;
      if (!el) return;
      const newPos = caretFromDigitsRight(display, rightDigits);
      el.setSelectionRange(newPos, newPos);
    });
  };

  // ----- คิดเงินดาวน์อัตโนมัติเมื่อราคา/เปอร์เซ็นต์เปลี่ยน -----
  const percentVal = useWatch({ control, name: "Deposit_Percent" });
  useEffect(() => {
    const price = toNum(priceVal) ?? 0;
    const percent = clamp(toNum(percentVal) ?? 0, 0, 100);
    const nextAmount = computeDepositAmount(price, percent);
    const curAmount = toNum(getValues("Deposit_Amount")) ?? 0;
    if (nextAmount !== curAmount) {
      setValue("Deposit_Amount", nextAmount, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [priceVal, percentVal, getValues, setValue]);

  // ----- actions รายจ่ายอื่น ๆ -----
  const toggleExpense = (label) => {
    const cur = getValues("Other_related_expenses") || [];
    const next = cur.includes(label)
      ? cur.filter((x) => x !== label)
      : [...cur, label];
    setValue("Other_related_expenses", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const selectAll = () =>
    allowedOptions.length &&
    setValue("Other_related_expenses", [...allowedOptions], {
      shouldDirty: true,
      shouldValidate: true,
    });
  const clearAll = () =>
    setValue("Other_related_expenses", [], {
      shouldDirty: true,
      shouldValidate: true,
    });

  const computedAmount = toNum(getValues("Deposit_Amount")) ?? 0;

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">ราคา</CardTitle>
        <p className="text-sm text-muted-foreground">
          ประเภทประกาศ:{" "}
          <span className="font-medium">
            {sellRentLocked === "SALE" ? "ขาย (SALE)" : "ให้เช่า (RENT)"}
          </span>{" "}
          — ขั้นตอนนี้ไม่สามารถเปลี่ยนประเภทได้
        </p>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* ราคา & เปอร์เซ็นต์ดาวน์ (เหลือ 2 ช่อง) */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Price (auto-grouping) */}
          <div>
            <label className="block mb-1">ราคาขาย (บาท)</label>
            <Controller
              name="Price"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    ฿
                  </span>
                  <Input
                    ref={priceInputRef}
                    key={`price-${resetKey}`}
                    type="text"
                    inputMode="decimal"
                    placeholder="เช่น 2,500,000"
                    value={priceDisplay}
                    onChange={(e) => handlePriceChange(e, field.onChange)}
                    onWheel={(e) => e.currentTarget.blur()}
                    className="pl-7"
                  />
                </div>
              )}
            />
            {errors?.Price && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Price.message}
              </p>
            )}
            <p className="text-xs text-gray-500 mt-1">
              แสดงผล: {formatBaht(watch("Price"))} บาท
            </p>
          </div>

          {/* Deposit_Percent */}
          <div>
            <label className="block mb-1">เงินดาวน์ (% ของราคาขาย)</label>
            <Controller
              name="Deposit_Percent"
              control={control}
              defaultValue=""
              render={({ field }) => (
                <div className="relative">
                  <Input
                    key={`percent-${resetKey}`}
                    type="number"
                    inputMode="decimal"
                    placeholder="เช่น 10"
                    {...field}
                    value={field.value ?? ""}
                    onChange={(e) => {
                      const v = e.target.value;
                      const n = v === "" ? "" : clamp(Number(v), 0, 100);
                      field.onChange(n);
                    }}
                    onWheel={(e) => e.currentTarget.blur()}
                    min={0}
                    max={100}
                    step="0.1"
                    className="pr-10"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                    %
                  </span>
                </div>
              )}
            />
            {errors?.Deposit_Percent && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Deposit_Percent.message}
              </p>
            )}
          </div>
        </div>

        {/* ผลลัพธ์เงินดาวน์ที่คำนวณได้ (แสดงแทนช่องกรอกเงินดาวน์) */}
        <div className="rounded-lg border px-4 py-3 bg-muted/20">
          <div className="text-sm text-muted-foreground">
            ผลลัพธ์เงินดาวน์ที่คำนวณได้
          </div>
          <div className="mt-1 text-xl font-semibold">
            ฿ {nfBaht2.format(Number(computedAmount || 0))}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            ระบบจะบันทึกจำนวนนี้ลงฟิลด์ <code>Deposit_Amount</code>{" "}
            ให้โดยอัตโนมัติ
          </p>
        </div>

        {/* รายจ่ายอื่น ๆ ตามหมวด */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="font-medium">
              รายจ่ายอื่น ๆ (เลือกหลายรายการได้)
            </span>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={selectAll}
                disabled={allowedOptions.length === 0}
              >
                เลือกทั้งหมด
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={clearAll}
              >
                ล้างทั้งหมด
              </Button>
            </div>
          </div>

          {allowedOptions.length === 0 ? (
            <p className="text-xs text-muted-foreground">
              ยังไม่มีพรีเซ็ต (โปรดเลือกประเภทในหน้ารายละเอียดก่อน)
            </p>
          ) : (
            <Controller
              name="Other_related_expenses"
              control={control}
              defaultValue={[]}
              render={({ field }) => {
                const selected = field.value || [];
                return (
                  <div className="flex flex-wrap gap-2">
                    {allowedOptions.map((label) => {
                      const active = selected.includes(label);
                      return (
                        <Button
                          key={label}
                          type="button"
                          variant={active ? "default" : "outline"}
                          onClick={() => {
                            const cur = selected;
                            const next = active
                              ? cur.filter((x) => x !== label)
                              : [...cur, label];
                            field.onChange(next);
                          }}
                          aria-pressed={active}
                          className="h-9"
                        >
                          {label}
                        </Button>
                      );
                    })}
                  </div>
                );
              }}
            />
          )}
          {errors?.Other_related_expenses && (
            <p className="text-red-500 text-sm mt-1">
              {errors.Other_related_expenses.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
