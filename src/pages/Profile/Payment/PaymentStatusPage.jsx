import { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { CheckCircle, XCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PaymentStatusPage() {
    const stripe = useStripe();
    const [message, setMessage] = useState(null);

    useEffect(() => {
        if (!stripe) {
            return;
        }

        // 4. ดึง client_secret จาก URL
        const clientSecret = new URLSearchParams(window.location.search).get(
            "payment_intent_client_secret"
        );

        if (!clientSecret) {
            return;
        }

        // 5. ดึงข้อมูล PaymentIntent ล่าสุดจาก Stripe
        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent.status) {
                case "succeeded":
                    setMessage("การชำระเงินสำเร็จ!");
                    break;
                case "processing":
                    setMessage("การชำระเงินของคุณกำลังดำเนินการ");
                    break;
                case "requires_payment_method":
                    setMessage("การชำระเงินล้มเหลว กรุณาลองอีกครั้ง");
                    break;
                default:
                    setMessage("มีบางอย่างผิดพลาด");
                    break;
            }
        });
    }, [stripe]);

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                {message === "การชำระเงินสำเร็จ!" ? (
                    <CheckCircle className="mx-auto size-16 text-green-500 mb-4" />
                ) : (
                    <XCircle className="mx-auto size-16 text-red-500 mb-4" />
                )}
                <h2 className="text-2xl font-bold">{message || "กำลังตรวจสอบ..."}</h2>
                <Link to="/profile/my-documents" className="text-blue-600 hover:underline mt-4 inline-block">
                    กลับไปที่หน้าเอกสารของฉัน
                </Link>
            </div>
        </div>
    );
}