import { useState } from "react";
import {
    PaymentElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button"; // (ตัวอย่าง) Import Button จาก ShadCN/UI
import { Loader2 } from "lucide-react"; // (ตัวอย่าง) Import Icon จาก Lucide
import { useNavigate } from "react-router";
import { useAuth } from "@/context/AuthContext";

export default function CheckoutForm({ documentData }) {
    const stripe = useStripe();
    const elements = useElements();
    const navigate = useNavigate();
    const { authUser } = useAuth()
    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [qrCodeUrl, setQrCodeUrl] = useState("");

    const handleSubmit = async (e) => {
        e.preventDefault();



        if (!stripe || !elements) {
            // Stripe.js hasn't yet loaded.
            return;
        }

        setIsLoading(true);
        setMessage(null); // Clear previous messages

        const postId = documentData?.postId;
        const unitId = documentData?.unitId;

        let returnUrl = '';
        const userType = authUser?.userType;

        if (!userType) {
            setMessage("เกิดข้อผิดพลาด: ไม่สามารถระบุประเภทผู้ใช้ได้");
            setIsLoading(false);
            return;
        }
        if (!postId || !unitId) { // (เพิ่ม) ตรวจสอบ unitId ด้วย
            setMessage("เกิดข้อผิดพลาด: ไม่พบ Post ID หรือ Unit ID");
            setIsLoading(false);
            return;
        }

        if (userType === 'Buyer') {
            returnUrl = `${window.location.origin}/buyer/payment-status?postId=${postId}&unitId=${unitId}`;
        } else if (userType === 'Seller') {
            returnUrl = `${window.location.origin}/seller/payment-status?postId=${postId}&unitId=${unitId}`;
        } else {
            // กรณีที่ไม่พบ userType หรือเป็นประเภทอื่น ให้มี URL สำรองหรือแสดง Error
            setMessage("เกิดข้อผิดพลาด: ไม่สามารถระบุประเภทผู้ใช้ได้");
            setIsLoading(false);
            return;
        }

        const { error, paymentIntent } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // URL ที่จะให้ Stripe redirect กลับมาหลังชำระเงินเสร็จ (สำหรับบางช่องทาง)
                return_url: returnUrl
            },
            // ป้องกันการ redirect ทันที เพื่อให้เราจัดการ QR Code ได้
            redirect: "if_required",
        });

        if (error) {
            setMessage(error.message);
            setIsLoading(false);
            return;
        }

        // ตรวจสอบสถานะของ Payment Intent ที่ได้กลับมา
        if (paymentIntent && paymentIntent.status === "requires_action") {
            // กรณีที่ต้องแสดง QR Code ของ PromptPay
            const qrUrl =
                paymentIntent.next_action.promptpay_display_qr_code.image_url_png;
            setQrCodeUrl(qrUrl);
            setMessage("กรุณาสแกน QR Code ด้านล่างเพื่อชำระเงินให้เสร็จสมบูรณ์");
        } else if (paymentIntent && paymentIntent.status === "succeeded") {
            // กรณีจ่ายด้วยบัตรเครดิตสำเร็จทันที
            setMessage("การชำระเงินสำเร็จ!");
            navigate(`/booking/${postId}/${unitId}`);
        }

        setIsLoading(false);
    };

    return (
        <div className="w-full">
            {/* --- ส่วนแสดง QR Code --- */}
            {qrCodeUrl ? (
                <div className="flex flex-col items-center text-center p-4 border rounded-lg">

                    <h2 className="text-xl font-semibold mb-3">
                        สแกนเพื่อชำระเงิน
                    </h2>
                    <img
                        src={qrCodeUrl}
                        alt="PromptPay QR Code"
                        className="w-48 h-48 mx-auto border rounded-md"
                    />
                    <p className="mt-4 text-gray-700">
                        {message}
                    </p>
                    <p className="mt-2 text-sm text-gray-500">
                        หลังจากชำระเงินแล้ว สถานะของคุณจะอัปเดตอัตโนมัติ
                    </p>
                </div>
            ) : (
                /* --- ส่วนแสดงฟอร์มชำระเงิน --- */
                <form id="payment-form" onSubmit={handleSubmit}>
                    <PaymentElement id="payment-element" options={{ layout: "tabs" }} />

                    <Button
                        disabled={isLoading || !stripe || !elements}
                        id="submit"
                        className="w-full mt-6 text-lg py-3"
                    >
                        {isLoading ? (
                            <Loader2 className="animate-spin" />
                        ) : (
                            "ชำระเงิน"
                        )}
                    </Button>

                    {/* แสดงข้อความ Error (ถ้ามี) */}
                    {message && (
                        <div
                            id="payment-message"
                            className="text-red-600 text-sm mt-3 text-center"
                        >
                            {message}
                        </div>
                    )}
                </form>
            )}
        </div>
    );
}