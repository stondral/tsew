import { getPayload } from "payload";
import config from "@/payload.config";

export async function getIncomingOrders(sellerId: string) {
  const payload = await getPayload({ config });
  const data = await payload.find({
    collection: "orders",
    where: {
      seller: { equals: sellerId },
      status: { equals: "PENDING" }
    },
    sort: "-createdAt"
  });
  return data.docs;
}

export async function acceptOrder(orderId: string, sellerId: string, deliveryData: { provider: string, cost: number, gst: number }) {
  const payload = await getPayload({ config });
  
  // Security check: Verify seller owns the order and it's PENDING
  const order = await payload.findByID({
    collection: "orders",
    id: orderId,
  });

  if (!order) throw new Error("Order not found");
  
  const orderSellerId = typeof order.seller === 'object' ? order.seller.id : order.seller;
  if (orderSellerId !== sellerId) {
    throw new Error("Unauthorized: You do not own this order");
  }

  if (order.status !== "PENDING") {
    throw new Error("Order is no longer pending");
  }

  return await payload.update({
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
    }
  });
}
