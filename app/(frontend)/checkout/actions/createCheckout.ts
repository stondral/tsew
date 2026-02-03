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

  // 3️⃣ Prepare order items with seller validation
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

  // 🔴 CRITICAL: Validate all items have sellers (fail loudly)
  orderItems.forEach(item => {
    if (!item.seller) {
      throw new Error(`Cart item ${item.productId} has no seller`);
    }
  });

  // 4️⃣ Group items by seller
  const itemsBySeller: Record<string, typeof orderItems> = {};
  orderItems.forEach(item => {
    const sellerId = item.seller as string;
    if (!itemsBySeller[sellerId]) {
      itemsBySeller[sellerId] = [];
    }
    itemsBySeller[sellerId].push(item);
  });

  // 5️⃣ Create orders (one per seller) with transaction-like rollback
  const createdOrderIds: string[] = [];
  const checkoutId = `CHK-${Date.now()}-${Math.random().toString(36).slice(2, 8).toUpperCase()}`;
  
  try {
    const sellerIds = Object.keys(itemsBySeller);
    
    for (const sellerId of sellerIds) {
      const items = itemsBySeller[sellerId];
      
      // Calculate seller-specific totals
      const sellerSubtotal = items.reduce((sum, item) => sum + (item.priceAtPurchase * item.quantity), 0);
      
      // Proportional platform fee distribution
      const sellerPlatformFee = Math.round((sellerSubtotal / calculation.subtotal) * calculation.platformFee);
      
      // Proportional shipping (if applicable)
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
          guestEmail: orderGuestEmail,
          guestPhone: orderGuestPhone,
          paymentMethod: intent.paymentMethod,
          paymentStatus: "pending",
          status: "PENDING",
          subtotal: sellerSubtotal,
          shippingCost: sellerShipping,
          gst: sellerTax,
          platformFee: sellerPlatformFee,
          total: sellerTotal,
          // Don't set razorpayOrderId here - it will be set in finaliseRazorpayCheckout for Razorpay payments
        },
      });
      
      createdOrderIds.push(order.id);
    }
    
    return {
      ok: true,
      checkoutId,
      orderIds: createdOrderIds,
      totalAmount: calculation.total,
    };
  } catch (error) {
    // 🔴 ROLLBACK: Delete any created orders
    console.error("Order creation failed, rolling back:", error);
    
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
    
    return { ok: false, error: "Failed to create orders" };
  }
}
