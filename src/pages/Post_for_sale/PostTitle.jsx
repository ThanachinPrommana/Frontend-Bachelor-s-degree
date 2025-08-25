import React from "react";
import { useNavigate } from "react-router-dom";
import { useFormContext } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import PostLayout from "@/layouts/PostLayout";
import { FileText, Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { postTitleSchema } from "@/components/schemas/postSchemas/postTitleSchema";
import { validateStep } from "@/lib/zodRHF";

const PostTitle = () => {
  const navigate = useNavigate();
  const form = useFormContext();

  const onSubmit = () => {
    const ok = validateStep(form, postTitleSchema, [
      "Property_Name",
      "Description",
    ]);
    if (!ok) return;
    navigate("/seller/post-for-sale/location");
  };

  return (
    <PostLayout currentStep={0}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardContent className="py-8 px-6 md:px-8 space-y-8">
            {/* Header */}
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <FileText className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">ตั้งหัวข้อประกาศ</h2>
              <p className="text-muted-foreground text-sm">
                โปรดตั้งหัวข้อและรายละเอียดเพื่อดึงดูดความสนใจของผู้ซื้อ
              </p>
            </div>

            {/* Helper banner */}
            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                หัวข้อควรบอก{" "}
                <span className="font-medium">ประเภท, ขนาด หรือทำเล</span> เช่น
                “บ้านเดี่ยว 2 ชั้น ใกล้ BTS” และรายละเอียดควรอธิบายจุดเด่น
              </p>
            </div>

            {/* Form */}
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField
                control={form.control}
                name="Property_Name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>หัวข้อประกาศ</FormLabel>
                    <Input
                      placeholder="เช่น บ้านเดี่ยว 2 ชั้น ใกล้รถไฟฟ้า"
                      {...field}
                      className="h-11"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="Description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>รายละเอียด</FormLabel>
                    <textarea
                      rows={4}
                      placeholder="กรอกรายละเอียดของทรัพย์สิน เช่น ทำเล ขนาด สภาพ หรือสิ่งอำนวยความสะดวก"
                      {...field}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end pt-2">
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

export default PostTitle;
