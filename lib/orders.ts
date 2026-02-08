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

export async function acceptOrder(
  orderId: string, 
  sellerId: string, 
  deliveryData: { 
    provider: string, 
    cost: number, 
    gst: number, 
    pickupWarehouse: string,
    trackingId?: string,
    carrierResponse?: unknown
  }
) {
  const payload = await getPayload({ config });
  
  // Security check: Verify seller owns the order and it's PENDING
  const order = await payload.findByID({
    collection: "orders",
    id: orderId,
    overrideAccess: true,
  });

  if (!order) throw new Error("Order not found");
  
  const orderSellerId = typeof order.seller === 'object' ? order.seller.id : order.seller;
  
  if (String(orderSellerId) !== String(sellerId)) {
    throw new Error(`Unauthorized: Ownership mismatch.`);
  }

  if (order.status !== "PENDING" && order.status !== "pending") {
    throw new Error(`Order is not PENDING`);
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
        pickupWarehouse: deliveryData.pickupWarehouse,
        trackingId: deliveryData.trackingId,
        carrierResponse: deliveryData.carrierResponse,
      }
    },
    overrideAccess: true,
  });
}

export async function updateOrderShippingAddress(
  orderId: string,
  sellerId: string,
  addressData: {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    apartment?: string;
    city: string;
    state: string;
    postalCode: string;
  }
) {
  const payload = await getPayload({ config });

  // Security check: Verify seller owns the order
  const order = await payload.findByID({
    collection: "orders",
    id: orderId,
    overrideAccess: true,
  });

  if (!order) throw new Error("Order not found");

  const orderSellerId = typeof order.seller === "object" ? order.seller.id : order.seller;

  if (String(orderSellerId) !== String(sellerId)) {
    throw new Error(`Unauthorized: Ownership mismatch.`);
  }

  // Find the address ID
  const addressId = typeof order.shippingAddress === "object" ? order.shippingAddress.id : order.shippingAddress;

  if (!addressId) throw new Error("No address found for this order");

  // Update the address record
  return await payload.update({
    collection: "addresses",
    id: addressId,
    data: addressData,
    overrideAccess: true,
  });
}
