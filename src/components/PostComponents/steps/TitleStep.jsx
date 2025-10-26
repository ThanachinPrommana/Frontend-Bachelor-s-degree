// src/components/PostComponents/EditPostDialog/steps/TitleStep.jsx
import { useFormContext, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function TitleStep({ errors, resetKey }) {
  const { register, control } = useFormContext();

  return (
    <Card className="shadow-sm">
      {/* Header แบบมีไอคอนและคำอธิบาย */}
      <CardHeader className="py-6">
        <div className="flex flex-col items-center gap-2">
          <span className="text-3xl" role="img" aria-label="home">
            🏠
          </span>
          <CardTitle className="text-xl">หัวข้อประกาศ</CardTitle>
          <p className="text-xs text-muted-foreground text-center">
            ตั้งชื่อประกาศให้ชัดเจนและระบุจุดเด่นสั้น ๆ
            เพื่อให้ผู้ซื้อค้นหาเจอและสนใจมากขึ้น
          </p>
        </div>
      </CardHeader>

      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ชื่อโพสต์ */}
        <div className="md:col-span-2">
          <label className="block mb-1">หัวข้อประกาศ</label>
          <Input
            placeholder="เช่น บ้านเดี่ยว 2 ชั้น ใกล้ BTS"
            {...register("Property_Name")}
          />
          {errors?.Property_Name && (
            <p className="text-red-500 text-sm mt-1">
              {errors.Property_Name.message}
            </p>
          )}
        </div>

        {/* รายละเอียด */}
        <div className="md:col-span-2">
          <label className="block mb-1">รายละเอียด</label>
          <Controller
            name="Description"
            control={control}
            defaultValue=""
            render={({ field }) => (
              <Textarea
                key={`desc-${resetKey}`}
                rows={5}
                placeholder="สรุปรายละเอียด จุดเด่น สภาพบ้าน หรือบริเวณใกล้เคียง"
                {...field}
                value={field.value ?? ""}
              />
            )}
          />
          {errors?.Description && (
            <p className="text-red-500 text-sm mt-1">
              {errors.Description.message}
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
