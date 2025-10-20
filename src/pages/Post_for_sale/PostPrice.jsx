// src/pages/Post_for_sale/PostPrice.jsx
import React, { useEffect, useMemo } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
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

/* ----------------------------------------------------------------
 * 1) Presets & categoryId → label (+ alias กันสะกด)
 * ---------------------------------------------------------------- */
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

// ให้ตรงกับหน้า PostDetail ที่ใช้ id ชุดนี้
const CATEGORY_LABEL_BY_ID = {
  cmegzfhx70007w2bwp63cbc1w: "บ้านเดี่ยว",
  cmegzft08000aw2bwx91l68z9: "ทาวน์เฮาส์",
  cmegzfdya0006w2bwq5d8alc7: "คอนโดมิเนียม",
  cmegzfov30009w2bwrxjpt7xn: "วิลล่า",
};

// กันสะกดผิด (เช่น เทาวน์เฮาส์ → ทาวน์เฮาส์)
const CATEGORY_LABEL_ALIAS = {
  เทาวน์เฮาส์: "ทาวน์เฮาส์",
};

/* ----------------------------------------------------------------
 * 2) Dynamic Zod schema: จำกัดให้เลือกได้เฉพาะรายการของหมวดนั้น
 * ---------------------------------------------------------------- */
const getPriceSchemaFor = (allowedOptions) => {
  const AllowedEnum = z.enum(
    allowedOptions.length ? allowedOptions : ["__dummy__"]
  );
  return z.object({
    Price: z.preprocess(
      (v) => (v === "" || v == null ? undefined : Number(v)),
      z
        .number({ required_error: "กรุณากรอกราคา" })
        .min(0, "กรุณากรอกราคาให้ ≥ 0")
    ),
    Deposit_Amount: z.preprocess(
      (v) => (v === "" || v == null ? undefined : Number(v)),
      z
        .number({ required_error: "กรุณากรอกเงินดาวน์" })
        .min(1, "กรุณากรอกเงินดาวน์ให้ถูกต้อง")
    ),
    Other_related_expenses: z.array(AllowedEnum).optional().default([]),
  });
};

/* ----------------------------------------------------------------
 * 3) Component (JSX ล้วน)
 * ---------------------------------------------------------------- */
function PostPrice() {
  const navigate = useNavigate();
  const form = useFormContext();

  // บังคับค่า Sell_Rent เป็น "SALE" เสมอ
  useEffect(() => {
    if (form.getValues("Sell_Rent") !== "SALE") {
      form.setValue("Sell_Rent", "SALE", {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [form]);

  // อ่าน categoryId จากฟอร์ม (เลือกไว้จากหน้า Detail)
  const rawCategoryId = form.watch("categoryId");
  let categoryLabel = CATEGORY_LABEL_BY_ID[rawCategoryId] || "";
  if (CATEGORY_LABEL_ALIAS[categoryLabel]) {
    categoryLabel = CATEGORY_LABEL_ALIAS[categoryLabel];
  }

  // ตัวเลือกที่อนุญาตตามหมวดนั้น ๆ
  const allowedOptions = useMemo(() => {
    return RECURRING_EXPENSE_PRESETS[categoryLabel] || [];
  }, [categoryLabel]);

  // สร้าง schema ตามตัวเลือกที่อนุญาต
  const priceSchema = useMemo(
    () => getPriceSchemaFor(allowedOptions),
    [allowedOptions]
  );

  // กรองค่าที่เคยเลือกไว้ให้เหลือเฉพาะของหมวดนั้น เมื่อหมวดเปลี่ยน
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

  // toggle เลือก/ยกเลิกเลือก
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

  // ลัด: เลือกทั้งหมด / ล้างทั้งหมด
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

  // onSubmit: กรองและเช็คประเภทก่อน validate เสมอ + log ให้เห็นชัด
  const onSubmit = () => {
    const categoryId = form.getValues("categoryId");
    let label = CATEGORY_LABEL_BY_ID[categoryId] || "";
    if (CATEGORY_LABEL_ALIAS[label]) label = CATEGORY_LABEL_ALIAS[label];
    const allowed = RECURRING_EXPENSE_PRESETS[label] || [];

    console.log("[PostPrice] submit", {
      categoryId,
      categoryLabel: label,
      allowedOptions: allowed,
      currentExpenses: form.getValues("Other_related_expenses"),
      price: form.getValues("Price"),
      deposit: form.getValues("Deposit_Amount"),
    });

    if (!label) {
      form.setError("categoryId", {
        type: "manual",
        message: "กรุณาเลือกประเภททรัพย์สินในหน้า ‘รายละเอียด’ ก่อน",
      });
      return;
    }

    // กรองรายการก่อน validate
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

    // validate ด้วย schema ไดนามิก
    const schema = getPriceSchemaFor(allowed);
    const ok = validateStep(form, schema, [
      "Price",
      "Deposit_Amount",
      "Other_related_expenses",
    ]);
    if (!ok) return;

    navigate("/seller/post-for-sale/inform");
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
                กำหนดราคาขาย พร้อมรายละเอียดทางการเงิน
              </p>
            </div>

            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                ประเภททรัพย์สิน:{" "}
                <span className="font-medium">
                  {categoryLabel || "ยังไม่เลือก"}
                </span>{" "}
                — ระบบจะแสดงเฉพาะรายการค่าใช้จ่ายรายเดือน/รายปีของประเภทนั้น
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              noValidate
            >
              {/* ราคา + เงินดาวน์ */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          type="number"
                          inputMode="decimal"
                          placeholder="เช่น 2,500,000"
                          {...field}
                          value={field.value ?? ""} // ✅ controlled
                          onWheel={(e) => e.currentTarget.blur()}
                          min={0}
                          step="0.01"
                          className="pl-7 h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="Deposit_Amount"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เงินดาวน์ (บาท)</FormLabel>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                          ฿
                        </span>
                        <Input
                          type="number"
                          inputMode="decimal"
                          placeholder="เช่น 250,000"
                          {...field}
                          value={field.value ?? ""} // ✅ controlled
                          onWheel={(e) => e.currentTarget.blur()}
                          min={0}
                          step="0.01"
                          className="pl-7 h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* รายจ่ายอื่น ๆ: เลือกจากพรีเซ็ตตามประเภท (หลายรายการได้) */}
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

              {/* Footer actions */}
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

export default PostPrice;
