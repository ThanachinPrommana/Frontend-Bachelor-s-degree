// src/components/PostComponents/EditPostDialog/steps/ConfirmStep.jsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

/** sanitize url: เติม https:// ถ้าขาด และอนุญาตเฉพาะ http/https */
function normalizeUrl(val) {
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
}

export default function ConfirmStep({
  categories,
  formatBaht,
  watch,
  resetKey,
}) {
  /* ====== read form ====== */
  const categoryId = watch("categoryId");
  const categoryName =
    categories.find((c) => String(c.id) === String(categoryId))?.name || "-";

  const sellRent =
    watch("Sell_Rent") === "RENT" ? "ให้เช่า (RENT)" : "ขาย (SALE)";
  const price = watch("Price");
  const depositPercent = watch("Deposit_Percent");
  const depositAmount = watch("Deposit_Amount");

  const usableArea = watch("Usable_Area");
  const landSize = watch("Land_Size");
  const bedrooms = watch("Bedrooms");
  const bathrooms = watch("Bathroom");
  const totalRooms = watch("Total_Rooms");
  const floors = watch("floor");
  const parking = watch("Parking_Space");

  const landmarks = Array.isArray(watch("Nearby_Landmarks"))
    ? watch("Nearby_Landmarks")
    : [];
  const amenities = Array.isArray(watch("Additional_Amenities"))
    ? watch("Additional_Amenities")
    : [];

  const readableParking = {
    "": "-",
    0: "ไม่มีที่จอด",
    1: "1 คัน",
    2: "2 คัน",
    3: "3 คันขึ้นไป",
  }[String(parking ?? "")];

  const name = watch("Name");
  const phone = watch("Phone");
  const linkLine = watch("Link_line");
  const linkFacebook = watch("Link_facbook");

  const address = watch("Address");
  const province = watch("Province");
  const district = watch("District");
  const subdistrict = watch("Subdistrict");
  const linkMap = watch("LinkMap");

  const title = watch("Property_Name");
  const description = watch("Description");

  /* ====== small atoms ====== */
  const Chip = ({ children }) => (
    <span className="inline-block rounded-full border px-2 py-0.5 text-xs bg-muted/40">
      {children}
    </span>
  );

  const Row = ({ label, value, right = false }) => (
    <div className="flex justify-between border-b py-2 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`ml-4 ${right ? "text-right" : ""}`}>
        {value ?? "-"}
      </span>
    </div>
  );

  const Section = ({ title, children }) => (
    <div>
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-lg">{title}</h3>
      </div>
      {children}
    </div>
  );

  /* ====== normalized links ====== */
  const lineUrl = normalizeUrl(linkLine);
  const fbUrl = normalizeUrl(linkFacebook);
  const mapUrl = normalizeUrl(linkMap);

  return (
    <Card className="shadow-sm">
      {/* Header แบบมีไอคอน + คำอธิบาย */}
      <CardHeader className="py-6">
        <div className="flex flex-col items-center gap-2">
          <div className="text-2xl" aria-hidden>
            🧾
          </div>
          <CardTitle className="text-xl">ตรวจสอบและยืนยัน</CardTitle>
          <p className="text-xs text-muted-foreground text-center">
            โปรดตรวจความถูกต้องของข้อมูลก่อนกดบันทึก
            ระบบจะอัปเดตประกาศตามข้อมูลด้านล่าง
          </p>
        </div>
      </CardHeader>

      <CardContent className="p-6 space-y-8" key={`confirm-${resetKey}`}>
        {/* สรุปบนสุด (ประเภทประกาศ / ราคาหลัก / ประเภททรัพย์) */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">ประเภทประกาศ</div>
            <div className="font-semibold mt-0.5">{sellRent}</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">ราคาหลัก</div>
            <div className="font-semibold mt-0.5">{formatBaht(price)} บาท</div>
          </div>
          <div className="rounded-lg border bg-muted/20 p-3">
            <div className="text-xs text-muted-foreground">ประเภททรัพย์</div>
            <div className="font-semibold mt-0.5">{categoryName}</div>
          </div>
        </section>

        {/* ข้อมูลประกาศ (หัวข้อ/รายละเอียด/ประเภท) */}
        <Section title="ข้อมูลประกาศ">
          <div className="space-y-1">
            <Row label="หัวข้อ" value={title || "-"} />
            <Row
              label="รายละเอียด"
              value={
                <span className="whitespace-pre-wrap">
                  {description || "-"}
                </span>
              }
            />
            <Row label="ประเภททรัพย์" value={categoryName} />
          </div>
        </Section>

        {/* ที่ตั้ง: 2 แถวตามที่ขอ + แผนที่กดได้ */}
        <Section title="ที่ตั้ง">
          <div className="space-y-1">
            {/* แถวบน: ที่อยู่บ้าน */}
            <Row label="ที่อยู่" value={address || "-"} />
            {/* แถวล่าง: จังหวัด, อำเภอ/เขต, ตำบล/แขวง */}
            <Row
              label="พื้นที่"
              value={
                [province, district, subdistrict].filter(Boolean).join(", ") ||
                "-"
              }
            />
            {/* ลิงก์แผนที่ (ยังคงแสดงใต้ 2 แถว) */}
            <Row
              label="ลิงก์แผนที่"
              value={
                mapUrl ? (
                  <a
                    href={mapUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    เปิดแผนที่
                  </a>
                ) : (
                  "-"
                )
              }
            />
          </div>
        </Section>

        {/* รายละเอียดทรัพย์ */}
        <Section title="รายละเอียดทรัพย์">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Row
              label="พื้นที่ใช้สอย"
              value={
                usableArea != null && usableArea !== ""
                  ? `${usableArea} ตร.ม.`
                  : "-"
              }
            />
            {landSize !== undefined && (
              <Row
                label="ขนาดที่ดิน"
                value={
                  landSize != null && landSize !== ""
                    ? `${landSize} ตร.วา`
                    : "-"
                }
              />
            )}
            <Row label="ห้องนอน" value={bedrooms ?? "-"} />
            <Row label="ห้องน้ำ" value={bathrooms ?? "-"} />
            <Row label="จำนวนห้องทั้งหมด" value={totalRooms ?? "-"} />
            {floors !== undefined && (
              <Row label="จำนวนชั้น" value={floors ?? "-"} />
            )}
            <Row label="ที่จอดรถ" value={readableParking} />
            <div className="md:col-span-3">
              <Row
                label="สถานที่ใกล้เคียง"
                value={
                  Array.isArray(landmarks) && landmarks.length ? (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {landmarks.map((x, i) => (
                        <Chip key={`lm-${i}-${x}`}>{x}</Chip>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )
                }
              />
            </div>
            <div className="md:col-span-3">
              <Row
                label="สิ่งอำนวยความสะดวก"
                value={
                  Array.isArray(amenities) && amenities.length ? (
                    <div className="flex flex-wrap gap-2 justify-end">
                      {amenities.map((x, i) => (
                        <Chip key={`am-${i}-${x}`}>{x}</Chip>
                      ))}
                    </div>
                  ) : (
                    "-"
                  )
                }
              />
            </div>
          </div>
        </Section>

        {/* ราคา / เงินดาวน์ */}
        <Section title="ราคา">
          <div className="grid md:grid-cols-3 gap-4 text-sm">
            <Row label="ประเภทประกาศ" value={sellRent} />
            <Row label="ราคาขาย" value={`${formatBaht(price)} บาท`} right />
            <Row
              label="เปอร์เซ็นต์เงินดาวน์"
              value={
                depositPercent != null && depositPercent !== ""
                  ? `${depositPercent} %`
                  : "-"
              }
              right
            />
            <Row
              label="เงินดาวน์โดยประมาณ"
              value={`${formatBaht(depositAmount)} บาท`}
              right
            />
          </div>
        </Section>

        {/* ผู้ขาย / ช่องทางติดต่อ */}
        <Section title="ข้อมูลผู้ขาย">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div className="space-y-1">
              <p className="text-gray-500">ชื่อผู้ขาย</p>
              <p className="font-medium">{name || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">เบอร์โทร</p>
              <p className="font-medium">{phone || "-"}</p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">LINE</p>
              <p className="font-medium break-all">
                {lineUrl ? (
                  <a
                    href={lineUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    เปิดลิงก์ LINE
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
            <div className="space-y-1">
              <p className="text-gray-500">Facebook</p>
              <p className="font-medium break-all">
                {fbUrl ? (
                  <a
                    href={fbUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary underline underline-offset-2"
                  >
                    เปิด Facebook
                  </a>
                ) : (
                  "-"
                )}
              </p>
            </div>
          </div>
        </Section>

        {/* หมายเหตุท้ายฟอร์ม */}
        <section className="rounded-lg border bg-amber-50 px-4 py-3 text-sm text-amber-800">
          โปรดตรวจสอบความถูกต้องอีกครั้งก่อนกด “บันทึกการเปลี่ยนแปลง”
          หากข้อมูลไม่ครบ ระบบอาจไม่อนุญาตให้ดำเนินการต่อ
        </section>
      </CardContent>
    </Card>
  );
}
