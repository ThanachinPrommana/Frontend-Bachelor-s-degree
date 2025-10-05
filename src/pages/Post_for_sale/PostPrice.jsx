// src/pages/Post_for_sale/PostPrice.jsx
import React, { useEffect } from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";
import { z } from "zod";
import {
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import PostLayout from "@/layouts/PostLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Info } from "lucide-react";
import { validateStep } from "@/lib/zodRHF";

/* ---------- helper: แปลงค่าว่างเป็น undefined เพื่อบังคับ required ---------- */
const toNumOrUndef = (v) =>
  v === "" || v === undefined || v === null ? undefined : Number(v);

/* ---------- Zod Schema (ขายอย่างเดียว / ไม่จำกัดเพดานราคา / ยอมให้ 0) ---------- */
const priceSchema = z.object({
  // ต้องกรอก และยอมให้ 0 (>= 0). ว่างจะไม่ผ่าน
  Price: z.preprocess(
    toNumOrUndef,
    z.number({ required_error: "กรุณากรอกราคา" }).min(0, "กรุณากรอกราคาให้ ≥ 0")
  ),

  // เงินดาวน์ ไม่จำกัดเพดาน, เว้นว่างได้ (จะไม่ส่ง)
  Deposit_Amount: z
    .preprocess(toNumOrUndef, z.number().min(0))
    .optional()
    .nullable(),

  // ดอกเบี้ยโดยประมาณ (%/ปี) — จำกัดบนไว้เพื่อกันค่าเพี้ยน
  Interest: z
    .preprocess(toNumOrUndef, z.number().min(0).max(25))
    .optional()
    .nullable(),

  // ข้อความอื่น ๆ
  Other_related_expenses: z.string().trim().max(200).optional(),
});

function PostPrice() {
  const navigate = useNavigate();
  const form = useFormContext();

  // บังคับค่า Sell_Rent เป็น "SALE" เสมอ (ให้ตรงกับหลังบ้าน/Prisma)
  useEffect(() => {
    if (form.getValues("Sell_Rent") !== "SALE") {
      form.setValue("Sell_Rent", "SALE", {
        shouldDirty: true,
        shouldValidate: false,
      });
    }
  }, [form]);

  const onSubmit = () => {
    // validate เฉพาะฟิลด์ของหน้า "ขาย"
    const ok = validateStep(form, priceSchema, [
      "Price",
      "Deposit_Amount",
      "Interest",
      "Other_related_expenses",
    ]);
    if (!ok) return;

    const v = form.getValues();
    const payload = {
      Sell_Rent: "SALE",
      Price: v.Price,
      // ถ้าผู้ใช้เว้นว่าง จะไม่มีค่าใน form (undefined) → แปลงเป็น null ก่อนส่ง
      Deposit_Amount: v.Deposit_Amount ?? null,
      Interest: v.Interest ?? null,
      Other_related_expenses: v.Other_related_expenses?.trim() || undefined,
    };

    // TODO: เรียก API อัปเดตราคา ถ้าต้องการ
    // await updatePostPrice(postId, payload);

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
                ระบบนี้เปิดใช้งานเฉพาะการ{" "}
                <span className="font-medium">ขาย (SALE)</span> เท่านั้น
              </p>
            </div>

            {/* Form */}
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              noValidate
            >
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Price */}
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
                            onWheel={(e) => e.currentTarget.blur()}
                            min={0} // 👈 อนุญาต 0 ที่ตัว input ด้วย
                            step="0.01"
                            className="pl-7 h-11"
                          />
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Deposit_Amount */}
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

                  {/* Interest */}
                  <FormField
                    control={form.control}
                    name="Interest"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>ดอกเบี้ยโดยประมาณ (%/ปี)</FormLabel>
                        <div className="relative">
                          <Input
                            type="number"
                            inputMode="decimal"
                            step="0.01"
                            placeholder="เช่น 3.50"
                            {...field}
                            onWheel={(e) => e.currentTarget.blur()}
                            min={0}
                            max={25}
                            className="pr-10 h-11"
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

                <p className="text-xs text-muted-foreground">
                  * ตัวเลขเป็นค่าประมาณเพื่อช่วยประกาศขายเท่านั้น
                </p>
              </div>

              {/* Others */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="Other_related_expenses"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>รายจ่ายอื่น ๆ (ถ้ามี)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="เช่น ค่าส่วนกลาง 500 บาท/เดือน"
                          {...field}
                          className="h-11"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
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
