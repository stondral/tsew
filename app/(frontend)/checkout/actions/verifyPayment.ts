// app/(frontend)/checkout/actions/verifyPayment.ts
"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import crypto from "crypto";
import { headers } from "next/headers";

export type VerifyPaymentInput = {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
};

export async function verifyPayment(data: VerifyPaymentInput) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }
  
  // 1. Verify Signature
  // signature = hmac_sha256(orderId + "|" + razorpayPaymentId, secret)
  const secret = process.env.RAZORPAY_KEY_SECRET;
  if (!secret) {
      return { ok: false, error: "Server configuration error" };
  }

  const text = data.razorpayOrderId + "|" + data.razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(text)
    .digest("hex");

  if (expectedSignature !== data.razorpaySignature) {
    return { ok: false, error: "Invalid payment signature" };
  }

  // 2. Update Order
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await (payload as any).findByID({
      collection: "orders",
      id: data.orderId,
    });

    if (!order || (typeof order.user === 'object' ? order.user.id : order.user) !== user.id) {
        return { ok: false, error: "Forbidden: You do not own this order" };
    }

    if (order.paymentStatus === "paid") {
        return { ok: true, alreadyPaid: true };
    }
    
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).update({
      collection: "orders",
      id: data.orderId,
      data: {
        paymentStatus: "paid",
        status: "processing",
        razorpayPaymentId: data.razorpayPaymentId,
        razorpaySignature: data.razorpaySignature,
      },
    });

    return { ok: true };
  } catch (e) {
    console.error("Verification failed", e);
    return { ok: false, error: "Database update failed" };
  }
}
