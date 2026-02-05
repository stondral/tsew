// app/(frontend)/checkout/actions/createRazorpayIntent.ts
"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { calculateCartTotals } from "@/lib/cart/calculations";
import { createRazorpayOrder } from "@/lib/payments/razorpay";
import { headers } from "next/headers";

export async function createRazorpayIntent(
  items: { productId: string, variantId?: string | null, quantity: number }[],
  discountCode?: string
) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user) return { ok: false, error: "Unauthorized" };
  if (items.length === 0) return { ok: false, error: "Cart is empty" };

  // 1. Calculate Totals & Validate Stock (with server-side discount revalidation)
  const calculation = await calculateCartTotals(items, payload, discountCode);
  if (calculation.isStockProblem) {
    return { ok: false, error: `Stock issues: ${calculation.stockErrors.join(", ")}` };
  }

  // 2. Create Razorpay order (using an ephemeral receipt ID)
  const ephemeralReceiptId = `PRE_${Date.now()}_${user.id.slice(-4)}`;
  const razorpayOrder = await createRazorpayOrder(
    ephemeralReceiptId,
    calculation.total
  );

  return {
    ok: true,
    razorpay: {
      orderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      key: process.env.RAZORPAY_KEY_ID!,
    },
    total: calculation.total,
    items: calculation.items, // Pass back so we can use the first image for the widget
  };
}
