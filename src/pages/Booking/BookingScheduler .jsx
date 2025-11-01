// BookingScheduler.js
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { apiClient } from '@/api/authconfig';

// ฟังก์ชันช่วยจัดรูปแบบวันที่และเวลาให้อ่านง่าย
const formatDateTime = (isoString) => {
    const date = new Date(isoString);
    const options = {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        timeZone: 'Asia/Bangkok',
    };
    return date.toLocaleDateString('th-TH', options);
};


const BookingScheduler = () => {
    const { postId, unitId } = useParams();
    const [slots, setSlots] = useState([]);
    const [selectedSlotId, setSelectedSlotId] = useState('');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [bookingSuccess, setBookingSuccess] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchAvailableSlots = async () => {
            if (!postId) {
                setError('ไม่พบ Post ID');
                setLoading(false);
                return;
            }
            try {
                setLoading(true);
                setError('');
                const response = await apiClient.get(`/list/slots/${postId}`);
                setSlots(response.data.items || []);
            } catch (err) {
                setError(err.response?.data?.message || err.message || 'ไม่สามารถโหลดข้อมูลได้');
            } finally {
                setLoading(false);
            }
        };
        fetchAvailableSlots();
    }, [postId]);

    const handleBooking = async () => {
        if (!selectedSlotId || !unitId) {
            setError('กรุณาเลือกช่วงเวลาและตรวจสอบ Unit ID');
            return;
        }
        try {
            setIsSubmitting(true);
            setError('');

            // ==========================================================
            // (แก้ไข) เปลี่ยนจาก fetch เป็น apiClient.post และใช้ Path ที่ถูกต้อง
            // ==========================================================
            const response = await apiClient.post('/user/booking', {
                dateTimeSlotId: selectedSlotId,
                unitId: unitId,
            });
            // ==========================================================

            // ไม่ต้อง .json() เองแล้ว เพราะ apiClient จัดการให้แล้ว
            setBookingSuccess(true);

        } catch (err) {
            // apiClient จะโยน Error ที่มี response.data มาให้เลย
            setError(err.response?.data?.message || err.message || 'เกิดข้อผิดพลาดในการจอง');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (loading) {
        return <p className="text-center text-gray-500">กำลังโหลดข้อมูลช่วงเวลา...</p>;
    }

    if (bookingSuccess) {
        return (
            <div className="max-w-2xl mx-auto my-8 p-8 bg-white rounded-lg shadow-lg text-center">
                <h2 className="text-2xl font-bold text-green-700 mb-4">การจองนัดหมายสำเร็จ!</h2>
                <p className="text-red-600 ">จะมีการแจ้งเตือน เมื่อถึงเวลานัดกรุณายืนยันการนัดในหน้าการจอง</p>
            </div>
        );
    }

    return (
        <div className="font-sans max-w-lg mx-auto my-8 p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">เลือกวันและเวลาที่สะดวกเพื่อนัดหมาย</h2>

            {error && (
                <p className="bg-red-100 border border-red-200 text-red-700 text-center p-3 rounded-md mb-4">
                    {error}
                </p>
            )}

            {slots.length > 0 ? (
                // (แก้ไข) เปลี่ยนจาก div grid เป็นฟอร์มที่มี select
                <div className="mb-6">
                    <label htmlFor="slot-select" className="block text-sm font-medium text-gray-700 mb-2">
                        ช่วงเวลาที่ว่าง:
                    </label>
                    <select
                        id="slot-select"
                        value={selectedSlotId}
                        onChange={(e) => setSelectedSlotId(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="" disabled>-- กรุณาเลือกช่วงเวลา --</option>
                        {slots.map((slot) => (
                            <option key={slot.id} value={slot.id}>
                                {formatDateTime(slot.startTime)}
                            </option>
                        ))}
                    </select>
                </div>
            ) : (
                <p className="text-center text-gray-500 mb-6">ขออภัย ขณะนี้ยังไม่มีช่วงเวลาที่ว่าง</p>
            )}

            {slots.length > 0 && (
                <button
                    className="w-full p-4 text-lg font-bold text-white bg-green-500 rounded-md 
                               hover:bg-green-600 transition-colors
                               disabled:bg-gray-400 disabled:cursor-not-allowed"
                    onClick={handleBooking}
                    disabled={!selectedSlotId || isSubmitting}
                >
                    {isSubmitting ? 'กำลังดำเนินการ...' : 'ยืนยันการนัดหมาย'}
                </button>
            )}
        </div>
    );
};

export default BookingScheduler;
