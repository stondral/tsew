"use server"

import { acceptOrder } from "@/lib/orders";
import { getSellerFromHeaders } from "@/lib/seller";
import { revalidatePath } from "next/cache";

export async function acceptOrderAction(orderId: string, deliveryData: { provider: string, cost: number, gst: number }) {
  const seller = await getSellerFromHeaders();
  if (!seller) return { ok: false, error: "Unauthorized" };

  try {
    await acceptOrder(orderId, seller.id, deliveryData);
    revalidatePath("/seller/orders/incoming");
    return { ok: true };
  } catch (error: any) {
    console.error("Failed to accept order:", error);
    return { ok: false, error: error.message || "Failed to accept order" };
  }
}
