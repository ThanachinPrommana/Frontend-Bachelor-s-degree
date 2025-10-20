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
import { useAuth } from "@/context/AuthContext";
import { fmtDateTimeTH } from "@/lib/bookingUtils";
import StatusBadge from "@/components/booking/StatusBadge";
import SlipButton from "@/components/booking/SlipButton";

export default function BuyerBooking() {
  const { toast } = useToast();
  const { authUser, revalidateUser, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search (debounce)
  const [rawQ, setRawQ] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ), 300);
    return () => clearTimeout(t);
  }, [rawQ]);

  // Pagination
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Slip preview
  const [slipOpen, setSlipOpen] = useState(false);
  const [slipUrl, setSlipUrl] = useState("");

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return bookings;

    return bookings.filter((b) =>
      [
        b?.propertyUnit?.propertyPost?.Property_Name,
        b?.bookingStatus,
        b?.dateTimeSlot?.startTime,
        b?.dateTimeSlot?.endTime,
        b?.Buyer?.user?.First_name, // ค้นหาจากชื่อตัวเอง
        b?.Buyer?.user?.Last_name,
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

  useEffect(() => {
    if (authUser?.Buyer?.Booking) {
      const userBookings = authUser.Buyer.Booking;
      setBookings(Array.isArray(userBookings) ? userBookings : []);
    } else {
      setBookings([]);
    }
  }, [authUser]);

  async function handleRefresh() {
    setIsRefreshing(true);
    try {
      await revalidateUser();
      toast({ title: "ข้อมูลล่าสุดแล้ว" });
    } catch (e) {
      console.error(e);
      toast({
        title: "รีเฟรชข้อมูลไม่สำเร็จ",
        description: e?.response?.data?.message || "โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setIsRefreshing(false);
    }
  }

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
            placeholder="ค้นหา (ประกาศ/สถานะ/เวลา)"
            className="md:max-w-xs"
            value={rawQ}
            onChange={(e) => setRawQ(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`}
            />{" "}
            รีเฟรช
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
                <th className="text-left px-4 py-2">ผู้ขาย (เจ้าของโพสต์)</th>
                <th className="text-left px-4 py-2">ช่วงเวลา</th>
                <th className="text-left px-4 py-2">สถานะ</th>
                <th className="text-left px-4 py-2">สลิป</th>
                <th className="text-left px-4 py-2">การดำเนินการ</th>
              </tr>
            </thead>
            <tbody>
              {authLoading ? (
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
                    {/* 1. แสดงชื่อประกาศ */}
                    <td className="px-4 py-2">
                      {b.propertyUnit?.propertyPost?.Property_Name ? (
                        <a
                          href={`/deposit/${b.propertyUnit.propertyPost.id}`}
                          className="underline"
                        >
                          {b.propertyUnit.propertyPost.Property_Name}
                        </a>
                      ) : (
                        "-"
                      )}
                    </td>

                    {/* 2. แสดงชื่อผู้ซื้อ (Buyer) เอง */}
                    <td className="px-4 py-2">
                      {`${b.Seller?.user?.First_name || ""} ${
                        b.Seller?.user?.Last_name || ""
                      }`.trim() || "-"}
                    </td>

                    {/* 3. แสดงช่วงเวลา */}
                    <td className="px-4 py-2">
                      {b.dateTimeSlot
                        ? `${fmtDateTimeTH(
                            b.dateTimeSlot.startTime
                          )} – ${fmtDateTimeTH(b.dateTimeSlot.endTime)}`
                        : "-"}
                    </td>

                    {/* 4. แสดงสถานะ */}
                    <td className="px-4 py-2">
                      <StatusBadge status={b.bookingStatus} />
                    </td>

                    {/* 5. แสดงสลิป */}
                    <td className="px-4 py-2">
                      <SlipButton url={b.Buyer.user.Payment.Payment_Slip} onOpen={openSlip} />
                    </td>
                    

                    {/* 6. แสดงการดำเนินการ */}
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