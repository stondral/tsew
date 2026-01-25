import { getPayload } from "payload";
import config from "@/payload.config";

export async function getIncomingOrders(sellerId: string) {
  const payload = await getPayload({ config });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (payload as any).find({
    collection: "orders",
    where: {
      seller: { equals: sellerId },
      status: { equals: "PENDING" }
    },
    sort: "-createdAt",
    overrideAccess: true,
  });
  return data.docs;
}

export async function acceptOrder(orderId: string, sellerId: string, deliveryData: { provider: string, cost: number, gst: number }) {
  const payload = await getPayload({ config });
  
  // Security check: Verify seller owns the order and it's PENDING
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (payload as any).findByID({
    collection: "orders",
    id: orderId,
    overrideAccess: true,
  });

  if (!order) throw new Error("Order not found");
  
  const orderSellerId = typeof order.seller === 'object' ? order.seller.id : order.seller;
  
  console.log("Accept Order ownership check:", { 
    orderId, 
    orderSellerId, 
    requestingSellerId: sellerId 
  });

  if (String(orderSellerId) !== String(sellerId)) {
    throw new Error(`Unauthorized: Ownership mismatch. Order Seller: ${orderSellerId}, Your ID: ${sellerId}`);
  }

  if (order.status !== "PENDING" && order.status !== "pending") {
    throw new Error(`Order is in state ${order.status}, not PENDING`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return await (payload as any).update({
    collection: "orders",
    id: orderId,
    data: {
      status: "ACCEPTED",
      delivery: {
        provider: deliveryData.provider,
        cost: deliveryData.cost,
        gst: deliveryData.gst,
        scheduledAt: new Date().toISOString(),
      }
    },
    overrideAccess: true, // Manual check performed above
  });
}
