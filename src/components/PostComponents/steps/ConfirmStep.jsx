import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function ConfirmStep({
  categories,
  formatBaht,
  watch,
  resetKey,
}) {
  const categoryId = watch("categoryId");
  const categoryName =
    categories.find((c) => String(c.id) === String(categoryId))?.name || "-";

  const readableParking = {
    "": "-",
    0: "ไม่มีที่จอด",
    1: "1 คัน",
    2: "2 คัน",
    3: "3 คันขึ้นไป",
  }[String(watch("Parking_Space") ?? "")];

  return (
    <Card className="shadow-sm">
      <CardHeader className="py-4">
        <CardTitle className="text-lg">ตรวจสอบและยืนยัน</CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6" key={`confirm-${resetKey}`}>
        {/* Detail summary */}
        <div>
          <h4 className="font-semibold mb-3">
            รายละเอียดทรัพย์ (ส่วนที่แก้ไขได้)
          </h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-500">ประเภท</p>
              <p className="font-medium">{categoryName}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">พื้นที่ใช้สอย</p>
              <p className="font-medium">{watch("Usable_Area") || "-"} ตร.ม.</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">ที่ดิน</p>
              <p className="font-medium">{watch("Land_Size") || "-"} ตร.วา</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">ห้องนอน</p>
              <p className="font-medium">{watch("Bedrooms") || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">ห้องน้ำ</p>
              <p className="font-medium">{watch("Bathroom") || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">ที่จอดรถ</p>
              <p className="font-medium">{readableParking}</p>
            </div>
          </div>
        </div>

        {/* Others */}
        <div>
          <h4 className="font-semibold mb-3">ข้อมูลอื่น ๆ</h4>
          <div className="grid md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-500">หัวข้อ</p>
              <p className="font-medium">{watch("Property_Name") || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">ราคา</p>
              <p className="font-medium">{formatBaht(watch("Price"))} บาท</p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-gray-500">รายละเอียด</p>
              <p className="font-medium whitespace-pre-wrap">
                {watch("Description") || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">เบอร์โทร</p>
              <p className="font-medium">{watch("Phone") || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">LINE</p>
              <p className="font-medium break-all">
                {watch("Link_line") || "-"}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Facebook</p>
              <p className="font-medium break-all">
                {watch("Link_facbook") || "-"}
              </p>
            </div>
            <div className="space-y-1 md:col-span-2">
              <p className="text-gray-500">ที่อยู่</p>
              <p className="font-medium">
                {watch("Address") || "-"}
                {watch("Province") ? `, ${watch("Province")}` : ""}
                {watch("District") ? `, ${watch("District")}` : ""}
                {watch("Subdistrict") ? `, ${watch("Subdistrict")}` : ""}
                {watch("PostalCode") ? ` ${watch("PostalCode")}` : ""}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
