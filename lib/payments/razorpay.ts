// lib/payments/razorpay.ts
import Razorpay from "razorpay";
import { RazorpayOrderPayload } from "./types";

const razorpay = new Razorpay({
  key_id: process.env.RAZORPAY_KEY_ID!,
  key_secret: process.env.RAZORPAY_KEY_SECRET!,
});

export async function createRazorpayOrder(
  orderId: string,
  amountInRupees: number,
): Promise<RazorpayOrderPayload> {
  const order = await razorpay.orders.create({
    amount: amountInRupees * 100, // paise
    currency: "INR",
    receipt: orderId,
    payment_capture: true,
  });

  return {
    id: order.id,
    amount: typeof order.amount === 'string' ? parseInt(order.amount, 10) : order.amount,
    currency: order.currency,
    receipt: order.receipt!,
  };
}
