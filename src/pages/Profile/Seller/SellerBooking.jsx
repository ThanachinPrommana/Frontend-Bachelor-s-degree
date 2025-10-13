// File: src/pages/Profile/Seller/SellerBooking.jsx

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
import { Loader2, RefreshCcw, ChevronLeft, ChevronRight } from "lucide-react";

import {
  getProfile as apiGetProfile,
  confirmSlip as apiConfirmSlip,
} from "@/api/user";

import { fmtDateTimeTH, maskEmail } from "@/lib/bookingUtils";
import StatusBadge from "@/components/booking/StatusBadge";
import SlipButton from "@/components/booking/SlipButton";

export default function SellerBooking() {
  const { toast } = useToast();

  // datasets
  const [bookingsByMe, setBookingsByMe] = useState([]); // ฉันเป็นผู้จอง (buyer)
  const [bookingsForMe, setBookingsForMe] = useState([]); // จองเข้าโพสต์ของฉัน (seller)

  const [loading, setLoading] = useState(false);
  const [confirmingId, setConfirmingId] = useState("");

  // Toggle view: 'forMe' (ฉันเป็นผู้ขาย) | 'byMe' (ฉันเป็นผู้จอง)
  const [mode, setMode] = useState("forMe");

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

  // ---------- โหมด/คอนฟิก เพื่อให้ UI บอกชัดว่า "ใครเป็นใคร" ----------
  const modeCfg = useMemo(() => {
    if (mode === "forMe") {
      // จองเข้าโพสต์ของฉัน: ฉัน = ผู้ขาย, อีกฝ่าย = ผู้จอง(buyer)
      return {
        badgeText: "โหมดผู้ขาย",
        badgeClass: "bg-emerald-100 text-emerald-800",
        desc: "คุณกำลังดูการจองที่เข้ามาในโพสต์ของคุณ (อีกฝ่ายคือ “ผู้ซื้อ”). คุณสามารถยืนยันสลิปได้ที่นี่",
        counterpartColLabel: "ผู้ซื้อ",
        searchPlaceholder: "ค้นหา (ประกาศ/ผู้จอง/สถานะ/เวลา)",
        // ดึงชื่อ/อีเมลของ "ผู้จอง"
        getCounterpartName: (b) => b?.buyer?.name,
        getCounterpartEmail: (b) => b?.buyer?.email,
        // ฟิลด์สำหรับการค้นหาเพิ่ม (โหมดนี้ค้นหา buyer)
        extraSearchFields: (b) => [b?.buyer?.name, b?.buyer?.email],
        showConfirmButton: true,
      };
    }
    // byMe: จองที่ฉันจองเอง: ฉัน = ผู้จอง, อีกฝ่าย = ผู้ขาย(seller)
    return {
      badgeText: "โหมดผู้จอง",
      badgeClass: "bg-sky-100 text-sky-800",
      desc: "คุณกำลังดูการจองที่คุณเป็นผู้จองเอง (อีกฝ่ายคือ “ผู้ขาย”). ใช้หน้านี้เพื่อติดตามสถานะนัดหมาย/ชำระเงิน",
      counterpartColLabel: "ผู้ขาย",
      searchPlaceholder: "ค้นหา (ประกาศ/ผู้ขาย/สถานะ/เวลา)",
      getCounterpartName: (b) => b?.seller?.name,
      getCounterpartEmail: (b) => b?.seller?.email,
      extraSearchFields: (b) => [b?.seller?.name, b?.seller?.email],
      showConfirmButton: false,
    };
  }, [mode]);

  const activeList = useMemo(
    () => (mode === "forMe" ? bookingsForMe : bookingsByMe),
    [mode, bookingsForMe, bookingsByMe]
  );

  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return activeList;

    return activeList.filter((b) =>
      [
        b?.post?.title,
        b?.status,
        b?.slot?.start,
        b?.slot?.end,
        ...modeCfg.extraSearchFields(b),
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(term))
    );
  }, [activeList, q, modeCfg]);

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
      // 1) ฉันเป็นผู้จอง (buyer)
      const byMe = res?.bookings || res?.bookingsByMe || [];
      // 2) จองเข้าโพสต์ของฉัน (seller)
      const forMe =
        res?.sellerBookings ||
        res?.bookingsForSeller ||
        res?.bookingsOfMyPosts ||
        [];
      setBookingsByMe(Array.isArray(byMe) ? byMe : []);
      setBookingsForMe(Array.isArray(forMe) ? forMe : []);
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
  }, [mode, q]);

  async function handleConfirm(bookingId) {
    if (mode !== "forMe") return; // ยืนยันเฉพาะจองที่เข้าโพสต์ของฉัน
    try {
      setConfirmingId(bookingId);
      await apiConfirmSlip(bookingId, { approve: true });
      await load();
      toast({
        title: "ยืนยันสลิปสำเร็จ",
        description: "สถานะถูกอัปเดตแล้ว",
      });
    } catch (e) {
      console.error(e);
      toast({
        title: "ยืนยันไม่สำเร็จ",
        description: e?.response?.data?.message || "โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setConfirmingId("");
    }
  }

  const EmptyMessage = () => (
    <tr>
      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
        {mode === "forMe"
          ? "ยังไม่มีรายการจองเข้ามาในโพสต์ของคุณ"
          : "ยังไม่มีรายการที่คุณได้ทำการจอง"}
      </td>
    </tr>
  );

  const openSlip = (url) => {
    setSlipUrl(url);
    setSlipOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Header + toggle + search */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
            <h3 className="font-semibold flex-1">การจอง</h3>

            {/* Toggle */}
            <div
              className="inline-flex rounded-md shadow-sm overflow-hidden"
              role="tablist"
              aria-label="โหมดการแสดงผลการจอง"
            >
              <Button
                variant={mode === "forMe" ? "default" : "outline"}
                className="rounded-none first:rounded-l-md"
                onClick={() => setMode("forMe")}
                role="tab"
                aria-selected={mode === "forMe"}
              >
                จองเข้าโพสต์ของฉัน
              </Button>
              <Button
                variant={mode === "byMe" ? "default" : "outline"}
                className="rounded-none last:rounded-r-md -ml-px"
                onClick={() => setMode("byMe")}
                role="tab"
                aria-selected={mode === "byMe"}
              >
                จองที่ฉันจองเอง
              </Button>
            </div>

            <Input
              placeholder={modeCfg.searchPlaceholder}
              className="md:max-w-xs"
              value={rawQ}
              onChange={(e) => setRawQ(e.target.value)}
            />
            <Button variant="outline" onClick={load}>
              <RefreshCcw className="w-4 h-4 mr-2" /> รีเฟรช
            </Button>
          </div>

          {/* Mode banner */}
          <div
            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${modeCfg.badgeClass}`}
            aria-live="polite"
          >
            {modeCfg.badgeText}
          </div>
          <p className="text-xs text-muted-foreground">{modeCfg.desc}</p>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              <tr>
                <th className="text-left px-4 py-2">ประกาศ</th>
                <th className="text-left px-4 py-2">
                  {modeCfg.counterpartColLabel}
                </th>
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

                    {/* ผู้จอง / ผู้ขาย (ตามโหมด) */}
                    <td className="px-4 py-2">
                      {modeCfg.getCounterpartName(b)
                        ? modeCfg.getCounterpartName(b)
                        : modeCfg.getCounterpartEmail(b)
                        ? maskEmail(modeCfg.getCounterpartEmail(b))
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
                      {modeCfg.showConfirmButton ? (
                        <Button
                          size="sm"
                          disabled={
                            (b.status || "").toUpperCase() === "CONFIRMED" ||
                            confirmingId === b.id
                          }
                          onClick={() => handleConfirm(b.id)}
                        >
                          {confirmingId === b.id ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          ) : null}
                          ยืนยันสลิป
                        </Button>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
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
