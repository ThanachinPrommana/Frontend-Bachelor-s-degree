// File: src/components/booking/StatusBadge.jsx

import React from 'react';

const StatusBadge = ({ status }) => {
    let colorClasses = 'bg-gray-100 text-gray-800';
    let statusText = status; // ค่าเริ่มต้น

    switch (status) {
        // --- สถานะการจอง (Booking Statuses) ---
        case 'PENDING_PAYMENT':
            colorClasses = 'bg-yellow-100 text-yellow-800';
            statusText = 'รอจ่ายมัดจำ';
            break;
        case 'CONFIRMED':
            colorClasses = 'bg-blue-100 text-blue-800';
            statusText = 'ยืนยันแล้ว'; // หรือ ชำระมัดจำแล้ว
            break;
        case 'PENDING_FINAL_VERIFICATION':
            colorClasses = 'bg-orange-100 text-orange-800';
            statusText = 'รอตรวจสอบสลิปสุดท้าย';
            break;
        case 'COMPLETED':
            colorClasses = 'bg-green-100 text-green-800';
            statusText = 'เสร็จสมบูรณ์';
            break;
        case 'CANCELLED':
            colorClasses = 'bg-red-100 text-red-800';
            statusText = 'ยกเลิกแล้ว';
            break;

        // --- สถานะเอกสาร (Document Statuses - ถ้าใช้ร่วมกัน) ---
        case 'PENDING':
             colorClasses = 'bg-yellow-100 text-yellow-800';
             statusText = 'รอตรวจสอบ';
             break;
         case 'APPROVED':
             colorClasses = 'bg-green-100 text-green-800';
             statusText = 'อนุมัติแล้ว';
             break;
         case 'REJECTED':
             colorClasses = 'bg-red-100 text-red-800';
             statusText = 'ถูกปฏิเสธ';
             break;
         case 'HIDDEN':
             colorClasses = 'bg-gray-100 text-gray-800';
             statusText = "สำเร็จ";
             break;
        // --- อื่นๆ ---
        default:
            statusText = status || 'ไม่ทราบสถานะ';
            break;
    }

    return (
        <span className={`px-2.5 py-1 text-xs font-semibold rounded-full whitespace-nowrap ${colorClasses}`}>
            {statusText}
        </span>
    );
};

export default StatusBadge; // <--- Export component