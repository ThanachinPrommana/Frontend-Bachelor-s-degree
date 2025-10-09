import { useEffect, useState } from "react";
import {
  PaymentElement,
  useStripe,
  useElements
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export default function CheckoutForm() {
    const stripe = useStripe();
    const elements = useElements();

    const [message, setMessage] = useState(null);
    const [isLoading, setIsLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);

        // 3. ยืนยันการชำระเงิน
        const { error } = await stripe.confirmPayment({
            elements,
            confirmParams: {
                // (สำคัญ) URL ที่จะให้ Stripe redirect กลับมาหลังชำระเงินเสร็จ
                return_url: `${window.location.origin}/payment-status`,
            },
        });

        // โค้ดส่วนนี้จะทำงานก็ต่อเมื่อมี error เกิดขึ้นทันที
        if (error.type === "card_error" || error.type === "validation_error") {
            setMessage(error.message);
        } else {
            setMessage("An unexpected error occurred.");
        }

        setIsLoading(false);
    };

    return (
        <form id="payment-form" onSubmit={handleSubmit}>
            <PaymentElement id="payment-element" />
            <Button disabled={isLoading || !stripe || !elements} id="submit" className="w-full mt-6">
                {isLoading ? <Loader2 className="animate-spin" /> : "ชำระเงิน"}
            </Button>
            {message && <div id="payment-message" className="text-red-500 text-sm mt-2 text-center">{message}</div>}
        </form>
    );
}