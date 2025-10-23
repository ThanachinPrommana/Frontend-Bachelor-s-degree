// src/pages/Post_for_sale/PostPrice.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useFormContext, useWatch } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PostLayout from "@/layouts/PostLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Info } from "lucide-react";
import { validateStep } from "@/lib/zodRHF";
import { postPriceSchema } from "@/components/schemas/postSchemas/postPriceSchema";

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

/* ---------- number-format helpers (TH grouping) ---------- */
const nfTH = new Intl.NumberFormat("th-TH", {
  minimumFractionDigits: 0,
  maximumFractionDigits: 2,
});

/** เอาเฉพาะตัวเลขกับจุดทศนิยม (ปล่อยให้มีจุดเดียว) */
function sanitizeNumericText(s) {
  if (s == null) return "";
  // เก็บเฉพาะ [0-9 .]
  let t = String(s).replace(/[^0-9.]/g, "");
  // อนุญาตจุดแรก ที่เหลือตัดทิ้ง
  const firstDot = t.indexOf(".");
  if (firstDot !== -1) {
    const head = t.slice(0, firstDot + 1);
    const tail = t.slice(firstDot + 1).replace(/\./g, ""); // remove extra dots
    t = head + tail;
  }
  return t;
}

/** แปลง text -> number (ถ้าเป็น "" หรือ "." ให้ undefined) */
function textToNumber(t) {
  if (!t || t === ".") return undefined;
  const n = Number(t);
  return Number.isFinite(n) ? n : undefined;
}

/** จัดรูปแบบด้วยคอมม่าแบบไทย (รองรับทศนิยม) */
function formatWithGrouping(t) {
  if (t == null || t === "") return "";
  // แยกส่วนจำนวนเต็ม/ทศนิยมจาก text (ที่ถูก sanitize แล้ว)
  const [intPart, fracPart] = String(t).split(".");
  const intNum = intPart === "" ? "" : nfTH.format(Number(intPart));
  return fracPart != null ? `${intNum}.${fracPart}` : intNum;
}

/** นับจำนวน "ตัวเลข" ทางขวาของตำแหน่งเคอร์เซอร์ (ไม่นับคอมม่า) */
function digitsRightCount(str, cursor) {
  let cnt = 0;
  for (let i = cursor; i < str.length; i++) {
    if (/[0-9]/.test(str[i])) cnt++;
  }
  return cnt;
}

/** หาตำแหน่งเคอร์เซอร์ใหม่จากจำนวนตัวเลขทางขวาเท่าเดิม */
function caretFromDigitsRight(str, digitsRight) {
  for (let i = str.length; i >= 0; i--) {
    if (digitsRightCount(str, i) === digitsRight) return i;
  }
  return str.length;
}

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

export default function PostPrice() {
  const navigate = useNavigate();
  const form = useFormContext();

  // ---- local UI state สำหรับช่อง "ราคาขาย" ที่แสดงคอมม่า ----
  const priceInputRef = useRef(null);
  const [priceDisplay, setPriceDisplay] = useState(""); // string มีคอมม่า

  // บังคับให้เป็น SALE ครั้งเดียว
  useEffect(() => {
    if (form.getValues("Sell_Rent") !== "SALE") {
      form.setValue("Sell_Rent", "SALE", {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // อ่าน category → label
  const rawCategoryId = useWatch({ control: form.control, name: "categoryId" });
  let categoryLabel = CATEGORY_LABEL_BY_ID[rawCategoryId] || "";
  if (CATEGORY_LABEL_ALIAS[categoryLabel])
    categoryLabel = CATEGORY_LABEL_ALIAS[categoryLabel];

  // allowed options ตามหมวด
  const allowedOptions = useMemo(
    () => RECURRING_EXPENSE_PRESETS[categoryLabel] || [],
    [categoryLabel]
  );

  // ทำความสะอาด options เมื่อหมวดเปลี่ยน
  useEffect(() => {
    const cur = form.getValues("Other_related_expenses") || [];
    if (!Array.isArray(cur)) {
      form.setValue("Other_related_expenses", [], {
        shouldDirty: true,
        shouldValidate: false,
      });
      return;
    }
    const filtered = cur.filter((x) => allowedOptions.includes(x));
    if (filtered.length !== cur.length) {
      form.setValue("Other_related_expenses", filtered, {
        shouldDirty: true,
        shouldValidate: true,
      });
    }
  }, [allowedOptions, form]);

  // ✅ ติดตามค่า Price (เชิงข้อมูล) เพื่อ sync กับ UI string ที่มีคอมม่า
  const priceVal = useWatch({ control: form.control, name: "Price" });
  useEffect(() => {
    // เมื่อค่าจริงใน form เปลี่ยนจากภายนอก → แปลงเป็น string พร้อมคอมม่า
    if (priceVal == null || priceVal === "") {
      setPriceDisplay("");
    } else {
      const raw = String(priceVal);
      const [i, f] = raw.split(".");
      const formatted =
        nfTH.format(Number(i ?? 0)) + (f != null ? `.${f}` : "");
      setPriceDisplay(formatted);
    }
  }, [priceVal]);

  // ✅ ฝากเปอร์เซ็นต์/จำนวนเงินไว้ตามเดิม
  const percentVal = useWatch({
    control: form.control,
    name: "Deposit_Percent",
  });

  // คำนวณ Deposit_Amount เมื่อ Price/Percent เปลี่ยน
  useEffect(() => {
    const price = toNum(priceVal) ?? 0;
    const percent = clamp(toNum(percentVal) ?? 0, 0, 100);
    const nextAmount = computeDepositAmount(price, percent);
    const curAmount = toNum(form.getValues("Deposit_Amount")) ?? 0;

    if (nextAmount !== curAmount) {
      form.setValue("Deposit_Amount", nextAmount, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [priceVal, percentVal, form]);

  const toggleExpense = (label) => {
    const cur = form.getValues("Other_related_expenses") || [];
    const next = cur.includes(label)
      ? cur.filter((x) => x !== label)
      : [...cur, label];
    form.setValue("Other_related_expenses", next, {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  const selectAll = () => {
    if (allowedOptions.length === 0) return;
    form.setValue("Other_related_expenses", [...allowedOptions], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };
  const clearAll = () => {
    form.setValue("Other_related_expenses", [], {
      shouldDirty: true,
      shouldValidate: true,
    });
  };

  // กดถัดไป
  const onSubmit = () => {
    // ทำความสะอาด options อีกรอบก่อน validate
    let label = CATEGORY_LABEL_BY_ID[form.getValues("categoryId")] || "";
    if (CATEGORY_LABEL_ALIAS[label]) label = CATEGORY_LABEL_ALIAS[label];
    const allowed = RECURRING_EXPENSE_PRESETS[label] || [];

    const cur = form.getValues("Other_related_expenses") || [];
    const cleaned = Array.isArray(cur)
      ? cur.filter((x) => allowed.includes(x))
      : [];
    if (cleaned.length !== cur.length) {
      form.setValue("Other_related_expenses", cleaned, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }

    // ยืนยัน Deposit_Amount ตามราคา/เปอร์เซ็นต์ล่าสุด
    const price = toNum(form.getValues("Price")) ?? 0;
    const percent = clamp(
      toNum(form.getValues("Deposit_Percent")) ?? 0,
      0,
      100
    );
    const amount = computeDepositAmount(price, percent);
    const curAmount = toNum(form.getValues("Deposit_Amount")) ?? 0;
    if (amount !== curAmount) {
      form.setValue("Deposit_Amount", amount, {
        shouldDirty: true,
        shouldValidate: false,
      });
    }

    const ok = validateStep(form, postPriceSchema, [
      "Price",
      "Deposit_Percent",
      "Deposit_Amount",
      "Other_related_expenses",
    ]);
    if (!ok) return;

    navigate("/seller/post-for-sale/inform");
  };

  const nfBaht = useMemo(
    () =>
      new Intl.NumberFormat("th-TH", {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }),
    []
  );
  const computedAmount = toNum(form.getValues("Deposit_Amount")) ?? 0;

  /* ========= onChange สำหรับราคาขาย: ใส่ลูกน้ำแบบเรียลไทม์ + รักษา caret ========= */
  const handlePriceChange = (e, fieldOnChange) => {
    const inputEl = priceInputRef.current;
    const rawStr = e.target.value;

    // ตำแหน่งเคอร์เซอร์เดิม + จำนวนตัวเลขทางขวา
    const prevCursor = inputEl?.selectionStart ?? rawStr.length;
    const rightDigits = digitsRightCount(rawStr, prevCursor);

    // ทำความสะอาดให้เหลือเลข/จุดเดียว
    const cleaned = sanitizeNumericText(rawStr);

    // เก็บค่าจริงเข้า form เป็น number (หรือ undefined ถ้ายังว่าง)
    const asNumber = textToNumber(cleaned);
    fieldOnChange(asNumber); // แจ้ง RHF

    // แปลงเป็น string ที่มีคอมม่าเพื่อแสดงผล
    const display = formatWithGrouping(cleaned);
    setPriceDisplay(display);

    // จัด caret ใหม่ให้เท่าจำนวนตัวเลขด้านขวาเดิม
    requestAnimationFrame(() => {
      const el = priceInputRef.current;
      if (!el) return;
      const newPos = caretFromDigitsRight(display, rightDigits);
      el.setSelectionRange(newPos, newPos);
    });
  };

  return (
    <PostLayout currentStep={3}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardContent className="py-8 px-6 md:px-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Coins className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">ตั้งราคา (ขาย)</h2>
              <p className="text-muted-foreground text-sm">
                ราคาขาย + เงินดาวน์เป็นเปอร์เซ็นต์
                (ระบบคำนวณจำนวนเงินให้อัตโนมัติ)
              </p>
            </div>

            {/* Helper */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                ประเภททรัพย์สิน:{" "}
                <span className="font-medium">
                  {CATEGORY_LABEL_BY_ID[rawCategoryId] || "ยังไม่เลือก"}
                </span>{" "}
                — ระบบจะแสดงเฉพาะรายการค่าใช้จ่ายของประเภทนั้น
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              noValidate
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Price (auto-grouping) */}
                <FormField
                  control={form.control}
                  name="Price"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ราคาขาย (บาท)</FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ฿
                        </span>
                        <Input
                          ref={priceInputRef}
                          type="text"
                          inputMode="decimal"
                          placeholder="เช่น 2,500,000"
                          value={priceDisplay}
                          onChange={(e) => handlePriceChange(e, field.onChange)}
                          onWheel={(e) => e.currentTarget.blur()}
                          className="pl-7 h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Percent */}
                <FormField
                  control={form.control}
                  name="Deposit_Percent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เงินดาวน์ (% ของราคาขาย)</FormLabel>
                      <div className="relative">
                        <Input
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
                          className="h-11 pr-10"
                        />
                        <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          %
                        </span>
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Calculated result (read-only) */}
              <div className="rounded-lg border px-4 py-3 bg-muted/20">
                <div className="text-sm text-muted-foreground">
                  ผลลัพธ์เงินดาวน์ที่คำนวณได้
                </div>
                <div className="mt-1 text-xl font-semibold">
                  ฿{" "}
                  {new Intl.NumberFormat("th-TH", {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(Number(computedAmount || 0))}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ระบบจะบันทึกจำนวนนี้ลงฟิลด์ <code>Deposit_Amount</code>{" "}
                  ให้โดยอัตโนมัติ
                </p>
              </div>

              {/* รายจ่ายอื่น ๆ */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <FormLabel>รายจ่ายอื่น ๆ (เลือกหลายรายการได้)</FormLabel>
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
                  <FormField
                    control={form.control}
                    name="Other_related_expenses"
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
                                onClick={() => toggleExpense(label)}
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
                <p className="text-xs text-muted-foreground">
                  ระบบจะบันทึกเฉพาะตัวเลือกที่คุณกดเลือกเท่านั้น
                </p>
              </div>

              {/* Footer */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/seller/post-for-sale/detail")}
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
