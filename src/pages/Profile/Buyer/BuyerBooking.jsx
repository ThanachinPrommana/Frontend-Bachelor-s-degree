// File: src/pages/Profile/Buyer/BuyerBooking.jsx

import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/components/ui/use-toast";
import { RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";

import { getProfile as apiGetProfile } from "@/api/user";

// ✅ ส่วนกลาง
import { fmtDateTimeTH, maskEmail } from "@/lib/bookingUtils";
import StatusBadge from "@/components/booking/StatusBadge";
import SlipButton from "@/components/booking/SlipButton";

export default function BuyerBooking() {
  const { toast } = useToast();

  const [bookings, setBookings] = useState([]); // ฉันเป็นผู้จอง (buyer)
  const [loading, setLoading] = useState(false);

  // search (debounce)
  const [rawQ, setRawQ] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ), 300);
    return () => clearTimeout(t);
  }, [rawQ]);

  // pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // slip preview
  const [slipOpen, setSlipOpen] = useState(false);
  const [slipUrl, setSlipUrl] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return bookings;

    return bookings.filter((b) =>
      [
        b?.post?.title,
        b?.status,
        b?.slot?.start,
        b?.slot?.end,
        // ฝั่ง Buyer แสดงข้อมูลของ "ผู้ขาย"
        b?.seller?.name,
        b?.seller?.email,
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(term))
    );
  }, [bookings, q]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  async function load() {
    try {
      setLoading(true);
      const res = await apiGetProfile();
      const byMe =
        res?.bookings || res?.bookingsByMe || res?.buyerBookings || [];
      setBookings(Array.isArray(byMe) ? byMe : []);
      setPage(1);
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

  useEffect(() => {
    setPage(1);
  }, [q]);

  const openSlip = (url) => {
    setSlipUrl(url);
    setSlipOpen(true);
  };

  const EmptyMessage = () => (
    <tr>
      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
        ยังไม่มีรายการที่คุณได้ทำการจอง
      </td>
    </tr>
  );

  return (
    <div className="space-y-4">
      {/* Header + search */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <h3 className="font-semibold flex-1">การจองของฉัน</h3>
          <Input
            placeholder="ค้นหา (ประกาศ/ผู้ขาย/สถานะ/เวลา)"
            className="md:max-w-xs"
            value={rawQ}
            onChange={(e) => setRawQ(e.target.value)}
          />
          <Button variant="outline" onClick={load}>
            <RefreshCcw className="w-4 h-4 mr-2" /> รีเฟรช
          </Button>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2">ประกาศ</th>
                <th className="text-left px-4 py-2">ผู้ขาย</th>
                <th className="text-left px-4 py-2">ช่วงเวลา</th>
                <th className="text-left px-4 py-2">สถานะ</th>
                <th className="text-left px-4 py-2">สลิป</th>
                <th className="text-left px-4 py-2">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={`sk-${i}`} className="border-t">
                    {[...Array(6)].map((__, j) => (
                      <td key={`sk-${i}-${j}`} className="px-4 py-3">
                        <Skeleton className="h-4 w-full" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : paged.length === 0 ? (
                <EmptyMessage />
              ) : (
                paged.map((b) => (
                  <tr key={b.id} className="border-t">
                    {/* ประกาศ (ลิงก์) */}
                    <td className="px-4 py-2">
                      {b.post?.title ? (
                        <a href={`/post/${b.postId}`} className="underline">
                          {b.post.title}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* ผู้ขาย */}
                    <td className="px-4 py-2">
                      {b.seller?.name
                        ? b.seller.name
                        : b.seller?.email
                        ? maskEmail(b.seller.email)
                        : "-"}
                    </td>

                    {/* ช่วงเวลา */}
                    <td className="px-4 py-2">
                      {b.slot
                        ? `${fmtDateTimeTH(b.slot.start)} – ${fmtDateTimeTH(
                            b.slot.end
                          )}`
                        : "-"}
                    </td>

                    {/* สถานะ */}
                    <td className="px-4 py-2">
                      <StatusBadge status={b.status} />
                    </td>

                    {/* สลิป */}
                    <td className="px-4 py-2">
                      <SlipButton url={b.slipUrl} onOpen={openSlip} />
                    </td>

                    {/* การดำเนินการ */}
                    <td className="px-4 py-2 space-x-2">
                      <span className="text-muted-foreground">—</span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-end gap-3">
        <span className="text-sm text-muted-foreground">
          หน้า {currentPage} / {totalPages} (ทั้งหมด {filtered.length} รายการ)
        </span>
        <div className="inline-flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage <= 1}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            ก่อนหน้า
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage >= totalPages}
          >
            ถัดไป
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>

      {/* Slip Preview Dialog */}
      <Dialog open={slipOpen} onOpenChange={setSlipOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>สลิปการชำระเงิน</DialogTitle>
          </DialogHeader>
          <div className="w-full">
            {slipUrl ? (
              <img
                src={slipUrl}
                alt="Slip Preview"
                className="w-full h-auto rounded-md"
              />
            ) : (
              <div className="text-center text-muted-foreground py-8">
                ไม่พบสลิป
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
