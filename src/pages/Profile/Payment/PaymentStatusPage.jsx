// PaymentStatusPage.js
import { useState, useEffect } from 'react';
import { useStripe } from '@stripe/react-stripe-js';
import { CheckCircle, XCircle, Loader2, House } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';

export default function PaymentStatusPage() {
    const stripe = useStripe();
    const [message, setMessage] = useState(null);
    const [status, setStatus] = useState('loading'); // 'loading', 'succeeded', 'failed'
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    const postId = searchParams.get("postId");
    const unitId = searchParams.get("unitId");
    const clientSecret = searchParams.get("payment_intent_client_secret");

    useEffect(() => {
        if (!stripe || !clientSecret) {
            setStatus('failed');
            setMessage('ข้อมูลการชำระเงิน');
            return;
        }

        stripe.retrievePaymentIntent(clientSecret).then(({ paymentIntent }) => {
            switch (paymentIntent.status) {
                case "succeeded":
                    setMessage("การชำระเงินสำเร็จ!");
                    setStatus('succeeded');
                    // Redirect ไปยัง BookingScheduler หลัง delay เล็กน้อย
                    setTimeout(() => {
                        navigate(`/booking/${postId}/${unitId}`);
                    }, 2000);
                    break;
                case "processing":
                    setMessage("การชำระเงินของคุณกำลังดำเนินการ");
                    setStatus('loading');
                    break;
                default:
                    setMessage("กลับไปหน้าเว็บไซต์");
                    setStatus('failed');
                    break;
            }
        });
    }, [stripe, clientSecret, postId, unitId]);

    const renderIcon = () => {
        if (status === 'succeeded') {
            return <CheckCircle className="mx-auto size-16 text-green-500 mb-4" />;
        }
        if (status === 'failed') {
            return <House className="mx-auto size-16 text-blue-500 mb-4" />;
        }
        return <Loader2 className="mx-auto size-16 text-gray-500 mb-4 animate-spin" />;
    };

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center">
            <div className="bg-white p-8 rounded-lg shadow-md text-center max-w-md w-full">
                {renderIcon()}
                <h2 className="text-2xl font-bold mb-4">{message || "กำลังตรวจสอบ..."}</h2>

                {/* fallback ปุ่มกรณีล้มเหลว */}
                {status === 'failed' && (
                    <a
                        href="/profile/my-documents"
                        className="text-blue-600 hover:underline mt-4 inline-block"
                    >
                        กลับไปที่หน้าเอกสารของฉัน
                    </a>
                )}
            </div>
        </div>
    );
}
