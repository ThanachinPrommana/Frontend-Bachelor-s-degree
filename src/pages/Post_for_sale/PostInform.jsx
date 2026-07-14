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

import { postInformSchema } from "@/components/schemas/postSchemas/postInformSchema";
import { validateStep } from "@/lib/zodRHF";

/* ========= helpers ========= */

/**
 * Converts a bare Line ID to the correct deep-link URL.
 * Accepts:
 *   - Full URL  → kept as-is (after basic validation)
 *   - Bare ID   → prepended with https://line.me/ti/p/~
 * Prevents double-prefix bugs (https://https://...).
 */
const normalizeLineUrl = (val) => {
  if (!val) return "";
  const raw = String(val).trim();
  if (!raw) return "";

  // Already a full URL — validate and return
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (!/^https?:$/i.test(u.protocol)) return "";
      return u.toString();
    } catch {
      return "";
    }
  }

  // Bare ID — build the Line deep-link
  return `https://line.me/ti/p/~${raw}`;
};

/**
 * Converts a bare Facebook username to the correct profile URL.
 * Accepts:
 *   - Full URL  → kept as-is (after basic validation)
 *   - Bare name → prepended with https://facebook.com/
 * Prevents double-prefix bugs.
 */
const normalizeFacebookUrl = (val) => {
  if (!val) return "";
  const raw = String(val).trim();
  if (!raw) return "";

  // Already a full URL — validate and return
  if (/^https?:\/\//i.test(raw)) {
    try {
      const u = new URL(raw);
      if (!/^https?:$/i.test(u.protocol)) return "";
      return u.toString();
    } catch {
      return "";
    }
  }

  // Bare username — build the Facebook profile URL
  return `https://facebook.com/${raw}`;
};

const sanitize = (v) => ({
  ...v,
  Name: v?.Name?.trim() || "",
  Phone: (v?.Phone || "").replace(/\D+/g, "").trim(),
  Link_line: normalizeLineUrl(v?.Link_line),
  Link_facbook: normalizeFacebookUrl(v?.Link_facbook),
});

const PostInform = () => {
  const navigate = useNavigate();
  const form = useFormContext();

  const onSubmit = () => {
    const ok = validateStep(form, postInformSchema, [
      "Name",
      "Phone",
      "Link_line",
      "Link_facbook",
    ]);
    if (!ok) return;

    const current = form.getValues();
    const nextValues = sanitize(current);

    form.reset(
      { ...current, ...nextValues },
      { keepDirty: true, keepTouched: true }
    );

    navigate("/seller/post-for-sale/upload");
  };

  return (
    <PostLayout currentStep={4}>
      <div className="flex justify-center">
        <Card className="w-full max-w-3xl shadow-xl border-0 ring-1 ring-black/5">
          <CardContent className="py-8 px-6 md:px-8 space-y-8">
            <div className="text-center space-y-2">
              <div className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <User className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-2xl font-semibold">ข้อมูลผู้ขาย</h2>
              <p className="text-muted-foreground text-sm">
                โปรดกรอกชื่อ เบอร์โทร และช่องทางติดต่อเพิ่มเติม (ถ้ามี)
              </p>
            </div>

            <div className="rounded-lg border bg-muted/30 px-4 py-3 text-sm text-muted-foreground flex items-start gap-3">
              <Info className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                กรุณากรอกเบอร์โทรที่ติดต่อได้จริง
                {" — สำหรับ LINE และ Facebook "}
                <span className="font-medium">พิมพ์แค่ ID หรือชื่อผู้ใช้ก็พอ</span>
                {" ระบบจะสร้างลิงก์ให้อัตโนมัติ"}
              </p>
            </div>

            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="space-y-8"
              noValidate
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                          value={field.value ?? ""}
                          placeholder="นายสมชาย บ้านดี"
                          className="pl-9 h-11"
                          autoComplete="name"
                          autoCapitalize="words"
                          onBlur={(e) => field.onChange(e.target.value.trim())}
                          aria-invalid={!!form.formState.errors?.Name}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          type="tel"
                          value={field.value ?? ""}
                          inputMode="tel"
                          autoComplete="tel-national"
                          placeholder="0812345678"
                          className="pl-9 h-11"
                          maxLength={10}
                          pattern="^0\\d{9}$"
                          title="กรุณากรอกเบอร์โทรศัพท์ไทย 10 หลัก (เริ่มด้วย 0)"
                          onBlur={(e) =>
                            field.onChange(
                              e.target.value.replace(/\D+/g, "").trim()
                            )
                          }
                          onPaste={(e) => {
                            const text = (
                              e.clipboardData || window.clipboardData
                            ).getData("text");
                            const digits = text.replace(/\D+/g, "");
                            e.preventDefault();
                            field.onChange(digits.slice(0, 10));
                          }}
                          aria-invalid={!!form.formState.errors?.Phone}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <h3 className="text-sm font-medium text-foreground/80">
                    ช่องทางติดต่อเพิ่มเติม (ไม่บังคับ)
                  </h3>
                </div>

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
                          type="text"
                          value={field.value ?? ""}
                          placeholder="Line ID หรือ https://line.me/ti/p/..."
                          className="pl-9 h-11"
                          autoComplete="off"
                          onBlur={(e) =>
                            field.onChange(normalizeLineUrl(e.target.value))
                          }
                          aria-invalid={!!form.formState.errors?.Link_line}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />

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
                          type="text"
                          value={field.value ?? ""}
                          placeholder="ชื่อผู้ใช้ Facebook หรือ https://facebook.com/..."
                          className="pl-9 h-11"
                          autoComplete="off"
                          onBlur={(e) =>
                            field.onChange(normalizeFacebookUrl(e.target.value))
                          }
                          aria-invalid={!!form.formState.errors?.Link_facbook}
                        />
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

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
