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
    const [selectedSlotId, setSelectedSlotId] = useState(null);
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
            const response = await fetch('/api/v1/bookings/create', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    dateTimeSlotId: selectedSlotId,
                    unitId: unitId,
                }),
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'เกิดข้อผิดพลาดในการจอง');
            }
            setBookingSuccess(true);
        } catch (err) {
            setError(err.message);
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
                <h2 className="text-2xl font-bold text-green-700 mb-4">✅ การจองนัดหมายสำเร็จ!</h2>
                <p className="text-gray-600">ทีมงานจะติดต่อกลับเพื่อยืนยันอีกครั้ง ขอบคุณครับ</p>
            </div>
        );
    }

    return (
        <div className="font-sans max-w-2xl mx-auto my-8 p-8 bg-white rounded-lg shadow-lg">
            <h2 className="text-2xl font-bold text-center text-gray-800 mb-6">เลือกวันและเวลาที่สะดวกเพื่อนัดหมาย</h2>

            {error && (
                <p className="bg-red-100 border border-red-200 text-red-700 text-center p-3 rounded-md mb-4">
                    {error}
                </p>
            )}

            {slots.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {slots.map((slot) => (
                        <button
                            key={slot.id}
                            className={`p-3 text-center rounded-md transition-colors duration-200 
                                ${selectedSlotId === slot.id
                                    ? 'bg-blue-500 text-white font-bold shadow-md'
                                    : 'bg-gray-50 border border-gray-300 hover:bg-blue-100 hover:border-blue-500'
                                }`}
                            onClick={() => setSelectedSlotId(slot.id)}
                        >
                            {formatDateTime(slot.startTime)}
                        </button>
                    ))}
                </div>
            ) : (
                <p className="text-center text-gray-500">ขออภัย ขณะนี้ยังไม่มีช่วงเวลาที่ว่าง</p>
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
