// ===============================
// File: src/pages/Profile/Buyer/BuyerSchedule.jsx
// Purpose: Buyer-facing schedule view derived from Bookings + Slots
// Features:
// - Filters: วันที่ตั้งแต่/ถึง, สถานะ
// - Client-side derive events จาก bookingsByMe (ไม่ต้องสร้างตาราง Schedule เพิ่ม)
// - ตารางแสดง: วันที่, เวลา, ประกาศ(ลิงก์), ผู้ขาย, สถานะ, สลิป, Action (ดาวน์โหลดไฟล์ .ics)
// - Debounced filter (เบา ๆ ผ่าน onChange ทั่วไป), toast error
// - Thai datetime format
// Notes:
// - ถ้าภายหลังมี endpoint เฉพาะ /buyer/schedule ก็สลับมาใช้งานได้เลย
// ===============================

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Download, Search, RefreshCcw } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

// 👉 API
import { getProfile as apiGetProfile } from "@/api/user";

const fmtDateTimeTH = (iso, withDate = true, withTime = true) =>
  iso
    ? new Date(iso).toLocaleString("th-TH", {
        timeZone: "Asia/Bangkok",
        ...(withDate && {
          year: "numeric",
          month: "short",
          day: "numeric",
        }),
        ...(withTime && { hour: "2-digit", minute: "2-digit" }),
      })
    : "-";

const toDateInputValue = (d = new Date()) =>
  new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 10);

const StatusBadge = ({ status }) => {
  const map = {
    PENDING: "bg-yellow-100 text-yellow-800",
    PAID: "bg-blue-100 text-blue-800",
    CONFIRMED: "bg-green-100 text-green-800",
    REJECTED: "bg-red-100 text-red-800",
    CANCELLED: "bg-gray-200 text-gray-700",
    COMPLETED: "bg-purple-100 text-purple-800",
  };
  const s = (status || "").toUpperCase();
  return (
    <span
      className={`px-2 py-1 rounded text-xs font-medium ${
        map[s] || "bg-muted"
      }`}
    >
      {s || "-"}
    </span>
  );
};

// สร้างไฟล์ .ics จาก booking/slot ให้ user โหลด
function downloadICS({
  title,
  startISO,
  endISO,
  description = "",
  location = "",
}) {
  const dtStart = new Date(startISO);
  const dtEnd = new Date(endISO);
  const pad = (n) => String(n).padStart(2, "0");
  const toICS = (d) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(
      d.getUTCDate()
    )}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//yourapp//buyer-schedule//TH",
    "BEGIN:VEVENT",
    `UID:${crypto.randomUUID?.() || Date.now()}@yourapp`,
    `DTSTAMP:${toICS(new Date())}`,
    `DTSTART:${toICS(dtStart)}`,
    `DTEND:${toICS(dtEnd)}`,
    `SUMMARY:${(title || "").replace(/\r?\n/g, " ")}`,
    `DESCRIPTION:${(description || "").replace(/\r?\n/g, " ")}`,
    `LOCATION:${(location || "").replace(/\r?\n/g, " ")}`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");

  const blob = new Blob([lines], { type: "text/calendar;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "booking.ics";
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 0);
}

export default function BuyerSchedule() {
  const { toast } = useToast();

  const today = toDateInputValue(new Date());
  const [filters, setFilters] = useState({
    dateFrom: today,
    dateTo: "",
    status: "ALL",
    q: "",
  });

  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(false);

  const q = filters.q.trim().toLowerCase();

  const filtered = useMemo(() => {
    let arr = [...bookings];

    if (filters.dateFrom) {
      const from = new Date(filters.dateFrom + "T00:00:00");
      arr = arr.filter((b) => !b.slot?.start || new Date(b.slot.start) >= from);
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo + "T23:59:59");
      arr = arr.filter((b) => !b.slot?.start || new Date(b.slot.start) <= to);
    }
    if (filters.status !== "ALL") {
      arr = arr.filter(
        (b) => (b.status || "").toUpperCase() === filters.status
      );
    }
    if (q) {
      arr = arr.filter((b) =>
        [
          b?.post?.title,
          b?.seller?.name,
          b?.seller?.email,
          b?.status,
          b?.slot?.start,
          b?.slot?.end,
        ]
          .filter(Boolean)
          .some((x) => String(x).toLowerCase().includes(q))
      );
    }

    // sort ตาม start time ใกล้สุดก่อน
    arr.sort((a, b) => {
      const A = Date.parse(a?.slot?.start || "") || 0;
      const B = Date.parse(b?.slot?.start || "") || 0;
      return A - B;
    });

    return arr;
  }, [bookings, filters.dateFrom, filters.dateTo, filters.status, q]);

  async function load() {
    try {
      setLoading(true);
      const res = await apiGetProfile();
      const byMe =
        res?.bookings || res?.bookingsByMe || res?.buyerBookings || [];
      setBookings(Array.isArray(byMe) ? byMe : []);
    } catch (e) {
      console.error(e);
      toast({
        title: "โหลดข้อมูลไม่สำเร็จ",
        description: e?.response?.data?.message || "โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="space-y-4">
      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid gap-3 md:grid-cols-5">
          <div className="md:col-span-2">
            <label className="text-sm">ค้นหา</label>
            <Input
              placeholder="หัวข้อโพสต์/ผู้ขาย/สถานะ/เวลา"
              className="mt-1"
              value={filters.q}
              onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm">จากวันที่</label>
            <Input
              type="date"
              className="mt-1"
              value={filters.dateFrom}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateFrom: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm">ถึงวันที่</label>
            <Input
              type="date"
              className="mt-1"
              value={filters.dateTo}
              onChange={(e) =>
                setFilters((f) => ({ ...f, dateTo: e.target.value }))
              }
            />
          </div>
          <div>
            <label className="text-sm">สถานะ</label>
            <Select
              value={filters.status}
              onValueChange={(v) => setFilters((f) => ({ ...f, status: v }))}
            >
              <SelectTrigger className="mt-1">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">ทั้งหมด</SelectItem>
                <SelectItem value="PENDING">รอดำเนินการ</SelectItem>
                <SelectItem value="PAID">ชำระแล้ว</SelectItem>
                <SelectItem value="CONFIRMED">ยืนยันแล้ว</SelectItem>
                <SelectItem value="COMPLETED">สำเร็จ</SelectItem>
                <SelectItem value="REJECTED">ถูกปฏิเสธ</SelectItem>
                <SelectItem value="CANCELLED">ยกเลิก</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-end">
            <div className="flex gap-2 w-full">
              <Button className="flex-1" onClick={load}>
                <RefreshCcw className="w-4 h-4 mr-2" /> รีเฟรช
              </Button>
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  setFilters({
                    dateFrom: toDateInputValue(new Date()),
                    dateTo: "",
                    status: "ALL",
                    q: "",
                  })
                }
              >
                <Search className="w-4 h-4 mr-2" /> ล้างตัวกรอง
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Schedule Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2">วันที่</th>
                <th className="text-left px-4 py-2">เวลา</th>
                <th className="text-left px-4 py-2">ประกาศ</th>
                <th className="text-left px-4 py-2">ผู้ขาย</th>
                <th className="text-left px-4 py-2">สถานะ</th>
                <th className="text-left px-4 py-2">สลิป</th>
                <th className="text-left px-4 py-2">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td className="px-4 py-6" colSpan={7}>
                    กำลังโหลด...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td className="px-4 py-6" colSpan={7}>
                    ไม่พบข้อมูลตามตัวกรอง
                  </td>
                </tr>
              ) : (
                filtered.map((b) => {
                  const start = b?.slot?.start;
                  const end = b?.slot?.end;
                  const dateStr = fmtDateTimeTH(start, true, false);
                  const timeStr = `${fmtDateTimeTH(
                    start,
                    false,
                    true
                  )} – ${fmtDateTimeTH(end, false, true)}`;

                  return (
                    <tr key={b.id} className="border-t">
                      <td className="px-4 py-2">{dateStr}</td>
                      <td className="px-4 py-2">{timeStr}</td>
                      <td className="px-4 py-2">
                        {b.post?.title ? (
                          <a href={`/post/${b.postId}`} className="underline">
                            {b.post.title}
                          </a>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {b?.seller?.name || b?.seller?.email || "-"}
                      </td>
                      <td className="px-4 py-2">
                        <StatusBadge status={b.status} />
                      </td>
                      <td className="px-4 py-2">
                        {b.slipUrl ? (
                          <a
                            className="underline"
                            href={b.slipUrl}
                            target="_blank"
                            rel="noreferrer"
                          >
                            เปิดสลิป
                          </a>
                        ) : (
                          <span className="text-muted-foreground">ไม่มี</span>
                        )}
                      </td>
                      <td className="px-4 py-2">
                        {start && end ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() =>
                              downloadICS({
                                title: b?.post?.title || "การจองของฉัน",
                                startISO: start,
                                endISO: end,
                                location: b?.post?.title || "",
                                description: `Booking #${b.id || ""} - สถานะ: ${
                                  b.status || ""
                                }`,
                              })
                            }
                          >
                            <Download className="w-4 h-4 mr-2" />
                            เพิ่มลงปฏิทิน
                          </Button>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
