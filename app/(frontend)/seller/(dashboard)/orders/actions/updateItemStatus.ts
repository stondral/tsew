"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function updateItemStatus(orderId: string, itemIdx: number, newStatus: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
    return { ok: false, error: "Unauthorized" };
  }

  // 1. Fetch the order
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (payload as any).findByID({
    collection: "orders",
    id: orderId,
  });

  if (!order) {
    return { ok: false, error: "Order not found" };
  }

  // 2. Validate items
  if (!order.items || !order.items[itemIdx]) {
    return { ok: false, error: "Item not found" };
  }

  const item = order.items[itemIdx];

  // 3. Security check: Seller must own this item
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if ((user as any).role !== "admin") {
      const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller.id;
      if (itemSellerId !== user.id) {
        return { ok: false, error: "Unauthorized - You don't own this item" };
      }
  }

  // 4. Update the item status in the array
  const updatedItems = [...order.items];
  updatedItems[itemIdx] = {
    ...item,
    status: newStatus,
  };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).update({
      collection: "orders",
      id: orderId,
      data: {
        items: updatedItems,
      },
    });

    revalidatePath(`/seller/orders/${orderId}`);
    return { ok: true };
  } catch (error) {
    console.error("Failed to update item status", error);
    return { ok: false, error: "Failed to update status" };
  }
}
