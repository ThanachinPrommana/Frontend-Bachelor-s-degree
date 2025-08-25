// src/pages/Post_for_sale/PostInform.jsx
import React from "react";
import { useFormContext } from "react-hook-form";
import { useNavigate } from "react-router-dom";

import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PostLayout from "@/layouts/PostLayout";
import { Card, CardContent } from "@/components/ui/card";
import { User, Phone, MessageCircle, Facebook, Info } from "lucide-react";

// ✅ schema + helper (ตามโปรเจ็กต์ของคุณ)
import { postInformSchema } from "@/components/schemas/postSchemas/postInformSchema";
import { validateStep } from "@/lib/zodRHF";

const PostInform = () => {
  const navigate = useNavigate();
  const form = useFormContext();

  const onSubmit = () => {
    const ok = validateStep(form, postInformSchema, [
      "Name",
      "Phone",
      "Link_line",
      "Link_facbook",
      "Contract_Seller", // ถ้ามีในฟอร์ม/สคีมา
    ]);
    if (!ok) return;
    navigate("/seller/post-for-sale/upload");
  };

  return (
    <PostLayout currentStep={4}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardContent className="py-8 px-6 md:px-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">ข้อมูลผู้ขาย</h2>
              <p className="text-muted-foreground text-sm">
                โปรดกรอกชื่อ เบอร์โทร และช่องทางติดต่อเพิ่มเติม (ถ้ามี)
              </p>
            </div>

            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                กรุณากรอกเบอร์โทรที่ติดต่อได้จริง และใส่ลิงก์แบบเต็ม{" "}
                <span className="font-medium">https://</span>{" "}
                เพื่อให้ผู้ซื้อคลิกได้ทันที
              </p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              {/* Basic info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* ชื่อผู้ขาย */}
                <FormField
                  control={form.control}
                  name="Name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ชื่อผู้ขาย</FormLabel>
                      <div className="relative">
                        <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          placeholder="นายสมชาย บ้านดี"
                          className="pl-9 h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* เบอร์โทรศัพท์ */}
                <FormField
                  control={form.control}
                  name="Phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>เบอร์โทรศัพท์</FormLabel>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          inputMode="tel"
                          placeholder="0812345678"
                          className="pl-9 h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Social links */}
              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground/80">
                    ช่องทางติดต่อเพิ่มเติม (ไม่บังคับ)
                  </h3>
                </div>

                {/* LINE */}
                <FormField
                  control={form.control}
                  name="Link_line"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ลิงก์ LINE</FormLabel>
                      <div className="relative">
                        <MessageCircle className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://line.me/ti/p/..."
                          className="pl-9 h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Facebook (คงชื่อฟิลด์ Link_facbook ให้ตรง backend) */}
                <FormField
                  control={form.control}
                  name="Link_facbook"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>ลิงก์ Facebook</FormLabel>
                      <div className="relative">
                        <Facebook className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          {...field}
                          type="url"
                          placeholder="https://facebook.com/username"
                          className="pl-9 h-11"
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* (ถ้ามี) เงื่อนไข/ข้อตกลงผู้ขาย */}
              {/* 
              <FormField
                control={form.control}
                name="Contract_Seller"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>เงื่อนไข/ข้อตกลงผู้ขาย</FormLabel>
                    <Input
                      {...field}
                      placeholder="เช่น นัดดูห้องวันทำการ, เงื่อนไขค่าธรรมเนียม"
                      className="h-11"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
              */}

              {/* Actions */}
              <div className="flex items-center justify-between pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/seller/post-for-sale/price")}
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

export default PostInform;
