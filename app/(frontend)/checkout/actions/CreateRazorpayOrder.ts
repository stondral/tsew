// app/(frontend)/checkout/actions/createRazorpayOrder.ts
"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { createRazorpayOrder } from "@/lib/payments/razorpay";

import { headers } from "next/headers";

export async function createRazorpayOrderForCheckout(orderId: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (payload as any).findByID({
    collection: "orders",
    id: orderId,
  });

  if (!order) {
    return { ok: false, error: "Order not found" };
  }

  const orderUserId = typeof order.user === "object" ? order.user.id : order.user;
  if (orderUserId !== user.id) {
    return { ok: false, error: "Forbidden" };
  }

  if (order.paymentStatus !== "pending") {
    return { ok: false, error: "Order already processed" };
  }

  // 🔐 Create Razorpay order (server truth)
  const razorpayOrder = await createRazorpayOrder(
    order.id,
    order.total,
  );

  // 🔒 Persist Razorpay order ID (CRITICAL)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await (payload as any).update({
    collection: "orders",
    id: order.id,
    data: {
      checkoutId: razorpayOrder.id,
    },
  });

  return {
    ok: true,
    razorpay: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID!,
    },
  };
}
