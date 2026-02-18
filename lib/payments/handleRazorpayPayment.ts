"use server"

import { getPayload } from "payload"
import config from "@/payload.config";
import { logger } from "@/lib/logger";

export interface RazorpayPaymentData {
  razorpay_payment_id: string
  razorpay_order_id: string
  razorpay_signature: string
}

export interface RazorpayPaymentResult {
  success: boolean
  message?: string
}

export const handleRazorpayPayment = async (
  orderData: RazorpayPaymentData
): Promise<RazorpayPaymentResult> => {
  const payload = await getPayload({ config })

  // 🔐 TODO: Implement real Razorpay signature verification here
  logger.debug({ orderData }, "Verifying Razorpay payment");

  // Casting to any because the generated types are outdated and missing the 'orders' collection
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = await (payload as any).find({
    collection: "orders",
    where: {
      checkoutId: {
        equals: orderData.razorpay_order_id,
      },
    },
    limit: 1,
  })

  if (orders.docs.length === 0) {
    return {
      success: false,
      message: "Order not found for Razorpay order ID",
    }
  }

  // ✅ Payment verified (signature verification goes here)
  return {
    success: true,
  }
}
