"use server"

import { acceptOrder } from "@/lib/orders";
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";

export async function acceptOrderAction(orderId: string, deliveryData: { provider: string, cost: number, gst: number, pickupWarehouse: string }) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  console.log("Accept Order Action Auth:", { 
    hasUser: !!user, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    role: (user as any)?.role,
    userId: user?.id 
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== 'seller' && (user as any).role !== 'admin')) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    await acceptOrder(orderId, user.id, deliveryData);
    revalidatePath("/seller/orders/incoming");
    return { ok: true };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (error: any) {
    console.error("Failed to accept order:", error);
    return { ok: false, error: error.message || "Failed to accept order" };
  }
}
