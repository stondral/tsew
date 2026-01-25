// app/(frontend)/checkout/actions/finaliseRazorpayCheckout.ts
"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { calculateCartTotals } from "@/lib/cart/calculations";
import { headers } from "next/headers";
import crypto from "crypto";

type FinaliseData = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  items: { productId: string, variantId?: string | null, quantity: number }[];
  addressId: string;
  guestEmail?: string;
  guestPhone?: string;
};

export async function finaliseRazorpayCheckout(data: FinaliseData) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user) return { ok: false, error: "Unauthorized" };

  // 1. Verify Signature
  const secret = process.env.RAZORPAY_KEY_SECRET!;
  const body = data.razorpay_order_id + "|" + data.razorpay_payment_id;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body.toString())
    .digest("hex");

  if (expectedSignature !== data.razorpay_signature) {
    return { ok: false, error: "Invalid payment signature" };
  }

  // 2. Fetch Calculation (Server Truth)
  const calculation = await calculateCartTotals(data.items, payload);
  if (calculation.isStockProblem) {
    return { ok: false, error: "Order failed: Stock changed during payment." };
  }

  // 3. Fetch Address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const address = await (payload as any).findByID({
    collection: "addresses",
    id: data.addressId,
  });
  if (!address) return { ok: false, error: "Address not found" };

  // 4. Create the Real Order
  const orderItems = calculation.items.map(item => ({
    productId: item.productId,
    productName: item.name,
    productImage: item.image,
    variantId: item.variantId || undefined,
    priceAtPurchase: item.price,
    quantity: item.quantity,
    seller: item.sellerId,
    status: "PENDING" as const,
  }));

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await (payload as any).create({
      collection: "orders",
      data: {
        user: user.id,
        seller: orderItems[0]?.seller,
        items: orderItems,
        shippingAddress: address.id,
        guestEmail: data.guestEmail || address.email,
        guestPhone: data.guestPhone || address.phone,
        paymentMethod: "razorpay",
        paymentStatus: "paid", // Verified by signature
        status: "PENDING",
        subtotal: calculation.subtotal,
        shippingCost: calculation.shipping,
        gst: calculation.tax,
        platformFee: calculation.platformFee,
        total: calculation.total,
        razorpayOrderId: data.razorpay_order_id,
        razorpayPaymentId: data.razorpay_payment_id,
      },
    });

    return { ok: true, orderId: order.id };
  } catch (e) {
    console.error("Order completion failed", e);
    return { ok: false, error: "Payment verified but order creation failed. Please contact support." };
  }
}
