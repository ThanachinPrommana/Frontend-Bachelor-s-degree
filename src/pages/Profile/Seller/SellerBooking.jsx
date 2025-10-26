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
import { Loader2, RefreshCcw, ChevronLeft, ChevronRight, Trash2 } from "lucide-react";

import {
  getProfile as apiGetProfile,
  confirmSlip as apiConfirmSlip,
} from "@/api/user";

import { fmtDateTimeTH, maskEmail } from "@/lib/bookingUtils";
import SlipButton from "@/components/booking/SlipButton";
import { useAuth } from "@/context/AuthContext";
import UploadFinalSlipButton from "@/components/UploadFinalSlipButton";
import StatusBadge from "@/components/StatusBadge";
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
import { useNavigate } from "react-router";
import { apiClient } from "@/api/authconfig";


export default function SellerBooking() {
  const { toast } = useToast();
  const { authUser, revalidateUser, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  // ใช้ State เหมือน BuyerBooking
  const [bookings, setBookings] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Search (debounce) - เหมือน BuyerBooking
  const [rawQ, setRawQ] = useState("");
  const [q, setQ] = useState("");
  useEffect(() => {
    const t = setTimeout(() => setQ(rawQ), 300);
    return () => clearTimeout(t);
  }, [rawQ]);

  const [deletingId, setDeletingId] = useState(null);

  // Pagination - เหมือน BuyerBooking
  const [page, setPage] = useState(1);
  const pageSize = 10;

  // Slip preview - เหมือน BuyerBooking
  const [slipOpen, setSlipOpen] = useState(false);
  const [slipUrl, setSlipUrl] = useState("");

  // Filtered logic - เหมือน BuyerBooking (ปรับให้ค้นหา Seller แทน Buyer)
  const filtered = useMemo(() => {
    const term = q.trim().toLowerCase();
    if (!term) return bookings;

    return bookings.filter((b) =>
      [
        b?.propertyUnit?.propertyPost?.Property_Name, // ชื่อประกาศ
        b?.bookingStatus, // สถานะ
        b?.dateTimeSlot?.startTime, // เวลาเริ่ม
        b?.dateTimeSlot?.endTime, // เวลาสิ้นสุด
        b?.Seller?.user?.First_name, // ชื่อผู้ขาย
        b?.Seller?.user?.Last_name, // นามสกุลผู้ขาย
      ]
        .filter(Boolean)
        .some((x) => String(x).toLowerCase().includes(term))
    );
  }, [bookings, q]);

  // Pagination calculations - เหมือน BuyerBooking
  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const paged = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, currentPage]);

  // useEffect ดึงข้อมูลจาก authUser - เหมือน BuyerBooking
  useEffect(() => {
    // ใช้ข้อมูลจาก Buyer.Booking เสมอ
    if (authUser?.Buyer?.Booking) {
      const userBookings = authUser.Buyer.Booking;
      setBookings(Array.isArray(userBookings) ? userBookings : []);
    } else {
      setBookings([]);
    }
  }, [authUser]);

  // handleRefresh - เหมือน BuyerBooking
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
      const res = await apiClient.delete(`/user/remove/${bookingId}`);
      const data = res.data;
      toast({
        title: "ยกเลิกการจองสำเร็จ",
        description: data.message,
      });
      await revalidateUser(); // รีเฟรชข้อมูล
    } catch (e) {
      console.error(e);
      toast({
        title: "ยกเลิกการจองไม่สำเร็จ",
        description: e?.response?.data?.message || e.message || "โปรดลองอีกครั้ง",
        variant: "destructive",
      });
    } finally {
      setDeletingId(null);
    }
  }

  // useEffect รีเซ็ต page - เหมือน BuyerBooking
  useEffect(() => {
    setPage(1);
  }, [q]);

  // openSlip - เหมือน BuyerBooking
  const openSlip = (url) => {
    setSlipUrl(url);
    setSlipOpen(true);
  };

  // EmptyMessage - เหมือน BuyerBooking
  const EmptyMessage = () => (
    <tr>
      <td className="px-4 py-8 text-center text-muted-foreground" colSpan={6}>
        ยังไม่มีรายการที่คุณได้ทำการจอง
      </td>
    </tr>
  );



  return (
    <div className="space-y-4">
      {/* Header + search - เหมือน BuyerBooking */}
      <Card>
        <CardContent className="p-4 flex flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <h3 className="font-semibold flex-1">การจองของฉัน</h3> {/* เปลี่ยน Title */}
          <Input
            placeholder="ค้นหา (ประกาศ/ผู้ขาย/สถานะ/เวลา)" // เปลี่ยน Placeholder
            className="md:max-w-xs"
            value={rawQ}
            onChange={(e) => setRawQ(e.target.value)}
          />
          <Button
            variant="outline"
            onClick={handleRefresh}
            disabled={isRefreshing || authLoading} // ใช้ authLoading ด้วย
          >
            <RefreshCcw
              className={`w-4 h-4 mr-2 ${isRefreshing || authLoading ? "animate-spin" : ""}`}
            />{" "}
            รีเฟรช
          </Button>
        </CardContent>
      </Card>

      {/* Table - เหมือน BuyerBooking */}
      <Card>
        <CardContent className="p-0 overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted">
              {/* ↓↓↓ ตรวจสอบว่าไม่มีช่องว่างหรือคอมเมนต์แปลกๆ ก่อน <tr> ↓↓↓ */}
              <tr>
                {/* ↓↓↓ ตรวจสอบว่าไม่มีช่องว่างหรือคอมเมนต์แปลกๆ ก่อน <th> แรก ↓↓↓ */}
                <th className="text-left px-4 py-2">ประกาศ</th>
                <th className="text-left px-4 py-2">ผู้ขาย</th>
                <th className="text-left px-4 py-2">ช่วงเวลา</th>
                <th className="text-left px-4 py-2">สถานะ</th>
                <th className="text-left px-4 py-2">สลิปมัดจำ</th>
                <th className="text-left px-4 py-2">การดำเนินการ</th>
                {/* ↑↑↑ ตรวจสอบว่าไม่มีช่องว่างหรือคอมเมนต์แปลกๆ หลัง <th> สุดท้าย ↑↑↑ */}
              </tr>
              {/* ↑↑↑ ตรวจสอบว่าไม่มีช่องว่างหรือคอมเมนต์แปลกๆ หลัง </tr> ↑↑↑ */}
            </thead>
            <tbody>
              {authLoading && !isRefreshing ? ( // แสดง Skeleton ตอนโหลดครั้งแรก
                Array.from({ length: 5 }).map((_, i) => (
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
                  // Logic หาสลิปมัดจำ - เหมือน BuyerBooking
                  const relevantUnitId = b.propertyUnitId;
                  const allUserPayments = authUser?.Payment || [];
                  const thisBookingPayment = relevantUnitId
                    ? allUserPayments.find(p => p.unitId === relevantUnitId)
                    : null;
                  const slipForThisBooking = thisBookingPayment?.Payment_Slip;
                  // (ใหม่) Logic ตรวจสอบเวลา
                  const appointmentStartTime = b?.dateTimeSlot?.startTime;
                  const now = new Date();
                  const startTime = new Date(appointmentStartTime);
                  const canDelete = appointmentStartTime && startTime > now;
                  const showDeleteButton = canDelete || b.bookingStatus === 'COMPLETED';
                  return (
                    <tr key={b.id} className="border-t">
                      {/* 1. แสดงชื่อประกาศ - เหมือน BuyerBooking */}
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

                      {/* 2. แสดงชื่อผู้ขาย (Seller) - เหมือน BuyerBooking */}
                      <td className="px-4 py-2">
                        {`${b.Seller?.user?.First_name || ""} ${b.Seller?.user?.Last_name || ""}`.trim() || "-"}
                      </td>

                      {/* 3. แสดงช่วงเวลา - เหมือน BuyerBooking */}
                      <td className="px-4 py-2">
                        {b.dateTimeSlot
                          ? `${fmtDateTimeTH(b.dateTimeSlot.startTime)} – ${fmtDateTimeTH(b.dateTimeSlot.endTime)}`
                          : "-"}
                      </td>

                      {/* 4. แสดงสถานะ - เหมือน BuyerBooking */}
                      <td className="px-4 py-2">
                        <StatusBadge status={b.bookingStatus} />
                      </td>

                      {/* 5. แสดงสลิปมัดจำ - เหมือน BuyerBooking */}
                      <td className="px-4 py-2">
                        <SlipButton url={slipForThisBooking} onOpen={openSlip} /> {/* ใช้ onOpen */}
                      </td>

                      {/* 6. แสดงการดำเนินการ (ปุ่ม Upload Final Slip) - เหมือน BuyerBooking */}

                      <td className="px-4 py-2">
                        <div className="flex items-center gap-1 justify-center">

                          {/* แสดงปุ่มลบ ถ้า showDeleteButton */}
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
                                    การดำเนินการนี้จะไม่สามารถย้อนกลับได้ ระบบจะคืนช่องเวลานี้ให้เป็น "ว่าง" และส่งแจ้งเตือนไปยังผู้ซื้อ.
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

                          {/* แสดงปุ่ม Upload ถ้า !showDeleteButton */}
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

      {/* Pagination - เหมือน BuyerBooking */}
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

      {/* Slip Preview Dialog - เหมือน BuyerBooking */}
      <Dialog open={slipOpen} onOpenChange={setSlipOpen}>
        <DialogContent className="sm:max-w-2xl h-[85vh]"> {/* ใช้ Class เดิม */}
          <DialogHeader><DialogTitle>สลิปการชำระเงิน</DialogTitle></DialogHeader>
          <div className="w-full h-full border rounded-md overflow-hidden">
            {slipUrl ? (
              <iframe
                src={slipUrl}
                title="Slip Preview" // Changed title for clarity
                className="w-full h-full border-0"
              />
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">ไม่พบ URL ของสลิป</div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
