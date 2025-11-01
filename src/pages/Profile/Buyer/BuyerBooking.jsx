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
import { RefreshCcw, ChevronLeft, ChevronRight, Trash2, Loader2, CheckSquare } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { fmtDateTimeTH } from "@/lib/bookingUtils";

import SlipButton from "@/components/booking/SlipButton";
import UploadFinalSlipButton from "@/components/UploadFinalSlipButton";
import StatusBadge from "@/components/StatusBadge";
import { useNavigate } from "react-router";
import { apiClient } from "@/api/authconfig";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";



export default function BuyerBooking() {
  const { toast } = useToast();
  const { authUser, revalidateUser, loading: authLoading } = useAuth();

  const [bookings, setBookings] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate()


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
  const [deletingId, setDeletingId] = useState(null);
  const [confirmingId, setConfirmingId] = useState(null); // ⭐️ (เพิ่ม State นี้)

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
  async function handleDelete(bookingId) {
    setDeletingId(bookingId);
    try {
      // ใช้ apiClient.delete และ path ไม่ต้องมี /api/ 
      // เพราะ baseURL ใน apiClient จัดการให้แล้ว
      const res = await apiClient.delete(`/user/remove/${bookingId}`);

      // Axios response ที่สำเร็จจะอยู่ใน res.data
      const data = res.data;

      toast({
        title: "ยกเลิกการจองสำเร็จ",
        description: data.message,
      });

      await revalidateUser(); // รีเฟรชข้อมูลในตาราง
    } catch (e) {
      console.error(e);
      toast({
        title: "ยกเลิกการจองไม่สำเร็จ",
        // (สำคัญ) Axios error message ที่มาจาก server จะอยู่ใน
        // e.response.data.message
        description: e?.response?.data?.message || e.message || "โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null); // ลบเสร็จสิ้น (ไม่ว่าจะสำเร็จหรือล้มเหลว)
    }
  }

  async function handleConfirm(bookingId) {
    setConfirmingId(bookingId);
    try {
      // (สำคัญ) 
      // เราต้องส่ง bookingId เป็น param ใน URL
      // โปรดตรวจสอบว่า router ของคุณคือ: 
      // router.post("/confirmed/booking/:bookingId", ...)

      const res = await apiClient.post(`/confirmed/booking/${bookingId}`);

      toast({
        title: "ยืนยันการซื้อสำเร็จ!",
        description: res.data.message,
      });
      await revalidateUser(); // รีเฟรชข้อมูลในตาราง
    } catch (e) {
      console.error("Error confirming purchase:", e);
      toast({
        title: "ยืนยันการซื้อไม่สำเร็จ",
        description: e?.response?.data?.message || e.message || "โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setConfirmingId(null);
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
                paged.map((b) => {
                  // --- (เพิ่ม) Logic สำหรับค้นหาสลิปที่ถูกต้อง ---
                  const relevantUnitId = b.propertyUnitId;
                  const allUserPayments = authUser?.Payment || [];

                  const thisBookingPayment = relevantUnitId
                    ? allUserPayments.find(p => p.unitId === relevantUnitId)
                    : null;

                  const slipForThisBooking = thisBookingPayment?.Payment_Slip;

                  // (ใหม่) ตรวจสอบเวลาเพื่อกำหนดว่าสามารถลบได้หรือไม่
                  const appointmentStartTime = b?.dateTimeSlot?.startTime;
                  const now = new Date();
                  const startTime = new Date(appointmentStartTime);
                  // (ใหม่) canDelete จะเป็น true ถ้า startTime มีค่า และ startTime อยู่ในอนาคต (มากกว่าเวลาปัจจุบัน)
                  const canDelete = appointmentStartTime && startTime > now;

                  const showDeleteButton = canDelete || b.bookingStatus === 'COMPLETED';
                  // ==========================================================
                  // (สำคัญ) เพิ่ม CONSOLE.LOG ตรงนี้
                  // ==========================================================
                  //               console.log(`
                  // ----- DEBUGGING ROW -----
                  // Booking ID: ${b.id}
                  // Unit ID to find: ${relevantUnitId}
                  // All Payments Received by Frontend:`, allUserPayments);
                  //               console.log(`Found Payment for this unit:`, thisBookingPayment);
                  //               console.log(`Final Slip URL: ${slipForThisBooking}`);
                  //               console.log(`-------------------------`);
                  // ==========================================================
                  // --- สิ้นสุดส่วนที่เพิ่ม ---

                  return (
                    <tr key={b.id} className="border-t">
                      {/* 1. แสดงชื่อประกาศ */}
                      <td className="px-4 py-2">
                        {b.propertyUnit?.propertyPost?.Property_Name ? (
                          <Button
                            variant="link"
                            // (สำคัญ) p-0 h-auto เพื่อให้ปุ่มไม่ดัน layout ของตาราง
                            className="p-0 h-auto font-normal text-left cursor-pointer text-blue-500 "
                            onClick={() => {
                              navigate(`/deposit/${b.propertyUnit.propertyPost.id}`)
                            }}
                          >
                            {b.propertyUnit.propertyPost.Property_Name}
                          </Button>
                        ) : (
                          "-"
                        )}
                      </td>

                      {/* 2. แสดงชื่อผู้ขาย (Seller) */}
                      <td className="px-4 py-2">
                        {`${b.Seller?.user?.First_name || ""} ${b.Seller?.user?.Last_name || ""
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

                      {/* 5. (สำคัญ) แก้ไขการแสดงสลิป */}
                      <td className="px-4 py-2">
                        {/* (สำคัญ) SlipButton จะทำงานได้ทันที */}
                        <SlipButton url={slipForThisBooking} />
                      </td>


                      {/* 6. (สำคัญ) แก้ไขการดำเนินการ ใช้ logic สลับปุ่ม */}
                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 justify-center">

                          {/* Show Delete Button if canDeleteBasedOnTime OR status is COMPLETED */}
                          {showDeleteButton && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="text-red-600 hover:text-red-700"
                                  disabled={deletingId === b.id}
                                >
                                  {deletingId === b.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Trash2 className="w-4 h-4" />
                                  )}
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ยืนยันการยกเลิกการจอง?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    การดำเนินการนี้จะไม่สามารถย้อนกลับได้ ระบบจะคืนช่องเวลานี้ให้เป็น "ว่าง" และส่งแจ้งเตือนไปยังผู้ขาย.
                                    {b.bookingStatus === 'COMPLETED' && <span className="font-semibold block mt-2 text-orange-600">หมายเหตุ: การจองนี้เสร็จสมบูรณ์แล้ว การลบจะลบเฉพาะประวัติการจอง ไม่ส่งผลต่อสถานะเอกสาร.</span>}
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleDelete(b.id)}
                                    className="bg-red-600 hover:bg-red-700"
                                  >
                                    ยืนยัน
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}
                          {b.bookingStatus === 'CONFIRMED' && !canDelete && (
                            <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button
                                  size="sm"
                                  className="bg-green-600 hover:bg-green-700"
                                  disabled={confirmingId === b.id}
                                >
                                  {confirmingId === b.id ? (
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                  ) : (
                                    <CheckSquare className="w-4 h-4 mr-2" />
                                  )}
                                  ยืนยันการซื้อ
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>ยืนยันการซื้อยูนิตนี้?</AlertDialogTitle>
                                  <AlertDialogDescription>
                                    การดำเนินการนี้จะเปลี่ยนสถานะยูนิตเป็น "SOLD" (ขายแล้ว) และถือว่าการจองเสร็จสมบูรณ์ (ไม่สามารถย้อนกลับได้)
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>ยกเลิก</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleConfirm(b.id)}
                                    className="bg-green-600 hover:bg-green-700"
                                  >
                                    ยืนยัน
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          )}

                          {/* Show Upload Button ONLY if Delete Button is NOT shown */}
                          {!showDeleteButton && (
                            <UploadFinalSlipButton
                              booking={b}
                              onUploadSuccess={revalidateUser}
                            />
                          )}

                        </div>
                      </td>
                    </tr>
                  );
                })
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
      {/* Slip Preview Dialog */}
      <Dialog open={slipOpen} onOpenChange={setSlipOpen}>
        {/* (แนะนำ) เพิ่มความสูงให้ Dialog เพื่อให้ iframe แสดงผลได้เต็มที่ */}
        <DialogContent className="sm:max-w-2xl h-[85vh]">
          <DialogHeader>
            <DialogTitle>สลิปการชำระเงิน</DialogTitle>
          </DialogHeader>

          {/* (สำคัญ) แก้ไขส่วนนี้ทั้งหมด */}
          <div className="w-full h-full border rounded-md overflow-hidden">
            {slipUrl ? (
              <iframe
                src={slipUrl}
                title="Stripe Receipt"
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                ไม่พบ URL ของสลิป
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}