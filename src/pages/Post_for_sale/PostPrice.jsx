import React from "react";
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
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import PostLayout from "@/layouts/PostLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Coins, Info } from "lucide-react";
import { validateStep } from "@/lib/zodRHF";

const priceSchema = z.object({
  Sell_Rent: z.enum(["SALE", "RENT"], { required_error: "กรุณาเลือกประเภท" }),
  Price: z.number().min(1, "กรุณากรอกราคา").optional().nullable(),
  Deposit_Amount: z.number().min(0).optional().nullable(),
  Interest: z.number().min(0).optional().nullable(),
  Deposit_Rent: z.number().min(0).optional().nullable(),
  Other_related_expenses: z.string().optional(),
});

function PostPrice() {
  const navigate = useNavigate();
  const form = useFormContext();
  const sellRentType = form.watch("Sell_Rent");

  const onSubmit = (data) => {
    const ok = validateStep(form, priceSchema, [
      "Sell_Rent",
      "Price",
      "Deposit_Amount",
      "Interest",
      "Deposit_Rent",
      "Other_related_expenses",
    ]);
    if (!ok) return;
    navigate("/seller/post-for-sale/inform");
  };

  const handleFloatChange = (e, field) => {
    const value = e.target.value;
    field.onChange(value === "" ? undefined : parseFloat(value));
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
              <h2 className="text-2xl font-semibold">ตั้งราคา</h2>
              <p className="text-muted-foreground text-sm">
                กำหนดราคาขายหรือค่าเช่าและรายละเอียดทางการเงิน
              </p>
            </div>

            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                เลือก <span className="font-medium">ประเภทการลงประกาศ</span>{" "}
                ก่อน ระบบจะแสดงฟิลด์ที่เกี่ยวข้องอัตโนมัติ
                (ขายจะแสดงราคา/ดาวน์/ดอกเบี้ย, เช่าจะแสดงค่าเช่า/เงินมัดจำ)
              </p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Type */}
              <div className="space-y-3">
                <FormField
                  control={form.control}
                  name="Sell_Rent"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ประเภทการลงประกาศ</FormLabel>
                      <Select
                        onValueChange={(val) => {
                          field.onChange(val);
                          if (val === "RENT") {
                            form.setValue("Deposit_Amount", undefined);
                            form.setValue("Interest", 0);
                          } else if (val === "SALE") {
                            form.setValue("Deposit_Rent", undefined);
                            form.setValue("Interest", undefined);
                          }
                        }}
                        value={field.value || ""}
                      >
                        <FormControl>
                          <SelectTrigger className="h-11">
                            <SelectValue placeholder="เลือกประเภท" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="SALE">ขาย (SALE)</SelectItem>
                          <SelectItem value="RENT">ให้เช่า (RENT)</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* SALE block */}
              {sellRentType === "SALE" && (
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
                              value={field.value ?? ""}
                              onChange={(e) => handleFloatChange(e, field)}
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
                              value={field.value ?? ""}
                              onChange={(e) => handleFloatChange(e, field)}
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
                              value={field.value ?? ""}
                              onChange={(e) => handleFloatChange(e, field)}
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
              )}

              {/* RENT block */}
              {sellRentType === "RENT" && (
                <div className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Rent Price */}
                    <FormField
                      control={form.control}
                      name="Price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ค่าเช่า (บาท/เดือน)</FormLabel>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ฿
                            </span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="เช่น 15,000"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => handleFloatChange(e, field)}
                              className="pl-7 h-11"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* Deposit_Rent */}
                    <FormField
                      control={form.control}
                      name="Deposit_Rent"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>ค่ามัดจำ (บาท)</FormLabel>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              ฿
                            </span>
                            <Input
                              type="number"
                              inputMode="decimal"
                              placeholder="เช่น 30,000"
                              {...field}
                              value={field.value ?? ""}
                              onChange={(e) => handleFloatChange(e, field)}
                              className="pl-7 h-11"
                            />
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <p className="text-xs text-muted-foreground">
                    * โดยทั่วไปมัดจำ 1–2 เดือน ขึ้นกับเงื่อนไขของผู้ให้เช่า
                  </p>
                </div>
              )}

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
