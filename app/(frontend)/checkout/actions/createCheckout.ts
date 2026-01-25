// app/(frontend)/checkout/actions/createCheckout.ts
"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { calculateCartTotals } from "@/lib/cart/calculations";
import { headers } from "next/headers";

type CheckoutIntent = {
  items: {
    productId: string;
    variantId?: string;
    quantity: number;
  }[];
  addressId: string;
  paymentMethod: "razorpay" | "cod";
  guestEmail?: string;
  guestPhone?: string;
};

export async function createCheckout(intent: CheckoutIntent) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) {
    return { ok: false, error: "Unauthorized" };
  }

  if (intent.items.length === 0) {
    return { ok: false, error: "Cart is empty" };
  }

  // 1️⃣ Validate address ownership
  // Use casting to bypass strict collection types that are missing from generated files
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const address = await (payload as any).findByID({
    collection: "addresses",
    id: intent.addressId,
  });

  if (!address || (typeof address.user === 'string' ? address.user : address.user.id) !== user.id) {
    return { ok: false, error: "Invalid address" };
  }

  // Use intention-provided guest info, or fallback to address info if it's a new or guest address
  const orderGuestEmail = intent.guestEmail || address.email;
  const orderGuestPhone = intent.guestPhone || address.phone;

  // 2️⃣ Calculate Totals & Validate Stock (Shared Logic)
  const cleanItems = intent.items.map(i => ({
    ...i,
    variantId: i.variantId || null
  }));

  const calculation = await calculateCartTotals(cleanItems, payload);

  if (calculation.isStockProblem) {
    return { 
      ok: false, 
      error: `Stock issues: ${calculation.stockErrors.join(", ")}` 
    };
  }

  // 3️⃣ Create ORDER (NO PAYMENT YET)
  const orderItems = calculation.items.map(item => ({
    productId: item.productId,
    productName: item.name,
    variantId: item.variantId || undefined,
    priceAtPurchase: item.price,
    quantity: item.quantity,
    seller: item.sellerId,
    status: "pending" as const,
  }));

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await (payload as any).create({
        collection: "orders",
        data: {
          user: user.id,
          seller: orderItems[0]?.seller, // Set root seller from first item
          items: orderItems,
          shippingAddress: address.id, 
          guestEmail: orderGuestEmail,
          guestPhone: orderGuestPhone,
          paymentMethod: intent.paymentMethod,
          paymentStatus: "pending",
          status: "PENDING",
          subtotal: calculation.subtotal,
          shippingCost: calculation.shipping,
          tax: calculation.tax,
          platformFee: calculation.platformFee,
          total: calculation.total,
        },
      });
    
      return {
        ok: true,
        orderId: order.id,
      };
  } catch (e) {
      console.error("Failed to create order", e);
      return { ok: false, error: "Failed to create order" };
  }
}
