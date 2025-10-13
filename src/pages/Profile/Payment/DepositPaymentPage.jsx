import { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { loadStripe } from '@stripe/stripe-js';
import { Elements } from '@stripe/react-stripe-js';
import { apiClient } from '@/api/authconfig';
import CheckoutForm from './CheckoutForm'; // เราจะสร้างไฟล์นี้ในขั้นตอนถัดไป
import { Loader2, Variable } from 'lucide-react';

// (สำคัญ) ใส่ Publishable Key ของคุณที่นี่อีกครั้ง
const stripePromise = loadStripe('pk_test_51R6USEEHWiwlX27ITAS8FPSrge8gvKXeRe12WMaZl79xFCVeea2cpExdBdNgrD8IbaX7ZnGCtiXCFBmsuEjYwlrY00E1uHNRCr');

export default function DepositPaymentPage() {
    const location = useLocation();
    const { documentData } = location.state || {};

    const [clientSecret, setClientSecret] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!documentData) {
            console.error("No document data found for payment.");
            // อาจจะ navigate กลับไปหน้าก่อนหน้า
            return;
        }

        console.log("Data received for payment:", documentData);
        console.log("Sending postId:", documentData.postId);
        console.log("Sending unitId:", documentData.unitId);

        // 1. ยิง API ไปขอ clientSecret จาก Backend
        apiClient.post('/create/payment', {
            postId: documentData.postId,
            unitId: documentData.unitId,
        })
            .then(response => {

                setClientSecret(response.data.clientSecret);
            })
            .catch(error => {
                console.error("Failed to create payment intent:", error);
            })
            .finally(() => {
                setIsLoading(false);
            });

    }, [documentData]);

    const appearance = {
        theme: 'flat',
        variables: {

        }
    };
    const options = {
        clientSecret,
        appearance,
        locale: "th"
    };

    return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
            <div className="w-full max-w-md bg-white p-8 rounded-lg shadow-lg">
                <h1 className="text-2xl font-bold text-center mb-6">ชำระเงินมัดจำ</h1>
                {isLoading ? (
                    <div className='flex justify-center'>
                        <span className="inline-flex items-center gap-2 ">
                            <Loader2 className="w-5 h-5 animate-spin" />
                        </span>
                    </div>
                ) : (
                    clientSecret && (
                        // 2. เมื่อได้ clientSecret แล้ว ให้ส่งต่อไปให้ Elements provider
                        <Elements options={options} stripe={stripePromise}>
                            <CheckoutForm documentData={documentData} />
                        </Elements>
                    )
                )}

            </div>
        </div>
    );
}