// File: src/components/booking/UploadFinalSlipButton.jsx
import React, { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/api/authconfig'; // ตรวจสอบ path ให้ถูกต้อง
import { Loader2 } from 'lucide-react';

export default function UploadFinalSlipButton({ booking, onUploadSuccess }) {
    const { toast } = useToast();
    const fileInputRef = useRef(null);
    const [isUploading, setIsUploading] = useState(false);

    // เงื่อนไขในการแสดงปุ่ม
    // 1. สถานะต้องเป็น CONFIRMED (รอถึงวันนัด)
    // 2. เวลาปัจจุบันต้องมากกว่าหรือเท่ากับเวลาเริ่มต้นการจอง
    const isTimeToShow = booking.bookingStatus === 'CONFIRMED' && new Date() >= new Date(booking.dateTimeSlot.startTime);

    if (!isTimeToShow) {
        return <span className="text-muted-foreground">—</span>;
    }

    const handleFileChange = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsUploading(true);
        const formData = new FormData();
        formData.append('finalSlip', file);

        try {
            const response = await apiClient.post(`/upload-final-slip/${booking.id}`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            toast({ title: "อัปโหลดสลิปสำเร็จ", description: "กรุณารอการตรวจสอบจากผู้ขาย" });
            onUploadSuccess(); // เรียกฟังก์ชัน revalidateUser
        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "อัปโหลดไม่สำเร็จ",
                description: error.response?.data?.message || "เกิดข้อผิดพลาด",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
            // Reset file input
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleClick = () => {
        fileInputRef.current?.click();
    };

    return (
        <>
            <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept="image/png, image/jpeg, application/pdf"
                disabled={isUploading}
            />
            <Button onClick={handleClick} disabled={isUploading} size="sm">
                {isUploading ? (
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : null}
                อัปโหลดสลิปสุดท้าย PNG
            </Button>
        </>
    );
}