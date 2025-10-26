import { useFormContext } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

/* ========= helpers ========= */
const normalizeUrl = (val) => {
  if (!val) return "";
  const raw = String(val).trim();
  if (!raw) return "";
  const withProto = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
  try {
    const u = new URL(withProto);
    if (!/^https?:$/i.test(u.protocol)) return "";
    return u.toString();
  } catch {
    return "";
  }
};

export default function InformStep({ errors, resetKey }) {
  const { register, setValue } = useFormContext();

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">ข้อมูลผู้ขาย / ช่องทางติดต่อ</CardTitle>
      </CardHeader>

      <CardContent className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* ชื่อผู้ขาย */}
          <div>
            <label className="block mb-1">ชื่อผู้ขาย</label>
            <Input
              key={`name-${resetKey}`}
              placeholder="นายสมชาย บ้านดี"
              {...register("Name")}
              onBlur={(e) =>
                setValue("Name", e.target.value.trim(), { shouldDirty: true })
              }
              autoComplete="name"
            />
            {errors?.Name && (
              <p className="text-red-500 text-sm mt-1">{errors.Name.message}</p>
            )}
          </div>

          {/* เบอร์โทร */}
          <div>
            <label className="block mb-1">เบอร์โทรศัพท์</label>
            <Input
              key={`phone-${resetKey}`}
              inputMode="tel"
              placeholder="0812345678"
              maxLength={10}
              {...register("Phone")}
              onBlur={(e) =>
                setValue(
                  "Phone",
                  e.target.value.replace(/\D+/g, "").slice(0, 10),
                  { shouldDirty: true }
                )
              }
            />
            {errors?.Phone && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Phone.message}
              </p>
            )}
          </div>

          {/* LINE */}
          <div>
            <label className="block mb-1">ลิงก์ LINE</label>
            <Input
              key={`line-${resetKey}`}
              type="url"
              placeholder="https://line.me/ti/p/..."
              {...register("Link_line")}
              onBlur={(e) =>
                setValue("Link_line", normalizeUrl(e.target.value), {
                  shouldDirty: true,
                })
              }
              autoComplete="url"
            />
            {errors?.Link_line && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Link_line.message}
              </p>
            )}
          </div>

          {/* Facebook — ใช้ Link_facbook เท่านั้น */}
          <div>
            <label className="block mb-1">ลิงก์ Facebook</label>
            <Input
              key={`fb-${resetKey}`}
              type="url"
              placeholder="https://facebook.com/username"
              {...register("Link_facbook")}
              onBlur={(e) =>
                setValue("Link_facbook", normalizeUrl(e.target.value), {
                  shouldDirty: true,
                })
              }
              autoComplete="url"
            />
            {errors?.Link_facbook && (
              <p className="text-red-500 text-sm mt-1">
                {errors.Link_facbook.message}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
