import { useFormContext, Controller } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function TitleStep({ errors, resetKey }) {
  const { register, control } = useFormContext();

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">หัวข้อประกาศ & รายละเอียด</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* ชื่อโพสต์ */}
        <div>
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
                key={`desc-${resetKey}`} // รี-mount เมื่อ resetKey เปลี่ยน
                rows={5}
                placeholder="สรุปรายละเอียด จุดเด่น สภาพบ้าน"
                {...field}
                value={field.value ?? ""} // กัน undefined/null
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
