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

  // 2. 🔴 IDEMPOTENCY CHECK: Check if this payment was already processed
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const existingOrders = await (payload as any).find({
      collection: "orders",
      where: {
        razorpayPaymentId: { equals: data.razorpay_payment_id },
      },
      limit: 1,
    });

    if (existingOrders.docs.length > 0) {
      // Payment already processed, return success with existing order IDs
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const relatedOrders = await (payload as any).find({
        collection: "orders",
        where: {
          razorpayPaymentId: { equals: data.razorpay_payment_id },
        },
      });
      
      return {
        ok: true,
        orderIds: relatedOrders.docs.map((o: { id: string }) => o.id),
        checkoutId: existingOrders.docs[0].checkoutId,
      };
    }
  } catch (e) {
    console.error("Idempotency check failed:", e);
    // Continue with order creation if check fails
  }

  // 3. Fetch Calculation (Server Truth)
  const calculation = await calculateCartTotals(data.items, payload);
  if (calculation.isStockProblem) {
    return { ok: false, error: "Order failed: Stock changed during payment." };
  }

  // 4. Fetch Address
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const address = await (payload as any).findByID({
    collection: "addresses",
    id: data.addressId,
  });
  if (!address) return { ok: false, error: "Address not found" };

  // 5. Prepare order items with seller validation
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

  // 🔴 CRITICAL: Validate all items have sellers
  orderItems.forEach(item => {
    if (!item.seller) {
      throw new Error(`Cart item ${item.productId} has no seller`);
    }
  });

  // 6. Group items by seller
  const itemsBySeller: Record<string, typeof orderItems> = {};
  orderItems.forEach(item => {
    const sellerId = item.seller as string;
    if (!itemsBySeller[sellerId]) {
      itemsBySeller[sellerId] = [];
    }
    itemsBySeller[sellerId].push(item);
  });

  // 7. Create orders (one per seller) with transaction-like rollback
  const createdOrderIds: string[] = [];
  const checkoutId = data.razorpay_order_id; // Use Razorpay order ID as checkout ID
  
  try {
    const sellerIds = Object.keys(itemsBySeller);
    
    for (const sellerId of sellerIds) {
      const items = itemsBySeller[sellerId];
      
      // Calculate seller-specific totals
      const sellerSubtotal = items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
      
      // Proportional platform fee distribution
      const sellerPlatformFee = Math.round((sellerSubtotal / calculation.subtotal) * calculation.platformFee);
      
      // Proportional shipping
      const sellerShipping = Math.round((sellerSubtotal / calculation.subtotal) * calculation.shipping);
      
      // Proportional tax
      const sellerTax = Math.round((sellerSubtotal / calculation.subtotal) * calculation.tax);
      
      // Calculate seller total
      const sellerTotal = sellerSubtotal + sellerShipping + sellerTax + sellerPlatformFee;
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const order = await (payload as any).create({
        collection: "orders",
        data: {
          user: user.id,
          seller: sellerId,
          items: items,
          shippingAddress: address.id,
          guestEmail: data.guestEmail || address.email,
          guestPhone: data.guestPhone || address.phone,
          paymentMethod: "razorpay",
          paymentStatus: "paid", // Verified by signature
          status: "PENDING",
          subtotal: sellerSubtotal,
          shippingCost: sellerShipping,
          gst: sellerTax,
          platformFee: sellerPlatformFee,
          total: sellerTotal,
          checkoutId: checkoutId,
          razorpayPaymentId: data.razorpay_payment_id,
        },
      });
      
      createdOrderIds.push(order.id);
    }

    return {
      ok: true,
      orderIds: createdOrderIds,
      checkoutId,
    };
  } catch (error) {
    // 🔴 ROLLBACK: Delete any created orders
    console.error("Razorpay order creation failed, rolling back:", error);
    
    for (const orderId of createdOrderIds) {
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        await (payload as any).delete({
          collection: "orders",
          id: orderId,
        });
      } catch (deleteError) {
        console.error(`Failed to rollback order ${orderId}:`, deleteError);
      }
    }
    
    return { ok: false, error: "Payment verified but order creation failed. Please contact support." };
  }
}
