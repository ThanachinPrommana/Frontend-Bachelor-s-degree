// File: src/components/booking/FinalSlipCard.jsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Link as LinkIcon, Check, X } from 'lucide-react'; // เพิ่ม X

export default function FinalSlipCard({ booking, onConfirm, isConfirming }) {
  if (!booking) return null;

  // (เพิ่ม) สร้าง state local สำหรับปุ่มปฏิเสธ
  const [isRejecting, setIsRejecting] = React.useState(false);
  const currentActionId = isConfirming || isRejecting; // ID ที่กำลังทำงาน

  // (เพิ่ม) ฟังก์ชันสำหรับ handle การกดปุ่ม (แยกตาม status)
  const handleAction = async (status) => {
    if (status === 'CANCELLED') {
      if (!window.confirm("คุณแน่ใจหรือไม่ว่าต้องการปฏิเสธสลิปนี้?")) return;
      setIsRejecting(booking.bookingId);
    }
    // การยืนยัน window.confirm สำหรับ COMPLETED อยู่ใน onConfirm แล้ว

    try {
      await onConfirm(booking.bookingId, status); // ส่ง status ไปด้วย
    } finally {
      setIsRejecting(false); // Reset state ไม่ว่าจะสำเร็จหรือล้มเหลว
    }
  };

  return (
    <Card className="bg-blue-50 border-blue-200">
      <CardHeader>
        <CardTitle className="text-lg text-blue-800">ยืนยันสลิปสุดท้าย</CardTitle>
        <CardDescription>
          ผู้ซื้อ <span className="font-semibold">{booking.buyerName}</span> ได้อัปโหลดสลิปสุดท้ายสำหรับยูนิต <span className="font-semibold">#{booking.unitNumber}</span> แล้ว
        </CardDescription>
      </CardHeader>
      <CardContent>
        {/* (แก้ไข) ปรับแก้ layout และเพิ่มปุ่ม */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
          <Button variant="outline" asChild className="w-full sm:w-auto">
            <a href={booking.finalSlipUrl} target="_blank" rel="noopener noreferrer">
              <LinkIcon className="w-4 h-4 mr-2" />
              ดูสลิป
            </a>
          </Button>
          {/* ปุ่มปฏิเสธ */}
          <Button
            variant="outline"
            onClick={() => handleAction('CANCELLED')}
            disabled={!!currentActionId} // Disable ถ้ามีปุ่มอื่นกำลังทำงาน
            className="w-full sm:w-auto border-red-500 text-red-500 hover:bg-red-50"
          >
            {isRejecting === booking.bookingId ? (
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <X className="w-4 h-4 mr-2" />
            )}
            ปฏิเสธ
          </Button>
          {/* ปุ่มยืนยัน */}
          <Button
            onClick={() => handleAction('COMPLETED')}
            disabled={!!currentActionId}
            className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
          >
            {isConfirming === booking.bookingId ? ( // ใช้ isConfirming state เดิม
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            ) : (
              <Check className="w-4 h-4 mr-2" />
            )}
            ยืนยันสลิปสุดท้าย
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}