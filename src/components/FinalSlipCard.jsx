// File: src/components/booking/FinalSlipCard.jsx

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Loader2, Link as LinkIcon, Check } from 'lucide-react';

export default function FinalSlipCard({ booking, onConfirm, isConfirming }) {
    if (!booking) return null;

    return (
        <Card className="bg-blue-50 border-blue-200">
            <CardHeader>
                <CardTitle className="text-lg text-blue-800">ยืนยันสลิปสุดท้าย</CardTitle>
                <CardDescription>
                    ผู้ซื้อ <span className="font-semibold">{booking.buyerName}</span> ได้อัปโหลดสลิปสุดท้ายสำหรับยูนิต <span className="font-semibold">#{booking.unitNumber}</span> แล้ว
                </CardDescription>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                    <Button variant="outline" asChild className="w-full sm:w-auto">
                        <a href={booking.finalSlipUrl} target="_blank" rel="noopener noreferrer">
                            <LinkIcon className="w-4 h-4 mr-2" />
                            ดูสลิป
                        </a>
                    </Button>
                    <Button 
                        onClick={() => onConfirm(booking.bookingId)} 
                        disabled={isConfirming} 
                        className="w-full sm:w-auto bg-blue-600 hover:bg-blue-700"
                    >
                        {isConfirming ? (
                            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        ) : (
                            <Check className="w-4 h-4 mr-2" />
                        )}
                        ยืนยันการชำระเงิน
                    </Button>
                </div>
            </CardContent>
        </Card>
    );
}