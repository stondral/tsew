"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { trackShipment } from "@/lib/delhivery";
import { getEmailTemplate, generateOrderItemRows } from "@/lib/email-templates";
import { revalidatePath } from "next/cache";

export async function getLiveTracking(orderId: string, waybill: string) {
  const payload = await getPayload({ config });
  
  // 1. Fetch live data from Delhivery
  const trackingData = await trackShipment({ waybill });
  if (!trackingData || !trackingData.ShipmentData || trackingData.ShipmentData.length === 0) {
    return { ok: false, error: "Tracking information not found." };
  }

  const shipmentData = trackingData.ShipmentData[0].Shipment;
  const currentStatus = shipmentData.Status.Status; // e.g., "Delivered", "In-Transit"
  const history = shipmentData.Scans || [];

  // 2. Map to internal status
  let mappedStatus = "";
  if (currentStatus.toLowerCase().includes("delivered")) {
    mappedStatus = "DELIVERED";
  } else if (
    currentStatus.toLowerCase().includes("in-transit") || 
    currentStatus.toLowerCase().includes("out for delivery") ||
    currentStatus.toLowerCase().includes("dispatched") ||
    currentStatus.toLowerCase().includes("picked up")
  ) {
    mappedStatus = "SHIPPED";
  }

  // 3. Sync with DB if needed
  if (mappedStatus) {
    const order = await payload.findByID({
      collection: "orders",
      id: orderId,
      depth: 2,
    });

    if (order && order.status !== mappedStatus) {
      console.log(`🔄 Auto-syncing order ${orderId} status: ${order.status} -> ${mappedStatus}`);
      
      await payload.update({
        collection: "orders",
        id: orderId,
        data: {
          status: mappedStatus,
        },
      });

      // 4. Send Email Notification
      try {
        const user = typeof order.user === 'object' ? order.user : null;
        const buyerEmail = user?.email || order.guestEmail;
        const username = user?.username || (typeof order.shippingAddress === 'object' && order.shippingAddress && 'firstName' in order.shippingAddress ? order.shippingAddress.firstName as string : undefined) || "Customer";

        if (buyerEmail) {
            const itemsTable = generateOrderItemRows(order.items.map((i: unknown) => {
                const item = i as Record<string, unknown>;
                return {
                    name: item.productName as string,
                    image: item.productImage as string,
                    quantity: item.quantity as number,
                    price: item.priceAtPurchase as number,
                    variant: item.variantId ? (item.productName as string).split('(')[1]?.replace(')', '') : null
                };
            }));

            const statusMessage = mappedStatus === 'DELIVERED' 
                ? "We hope you enjoy your purchase! Thank you for shopping with Stond Emporium."
                : "Your package is on the move and getting closer to you.";

            const emailHtml = getEmailTemplate('order-status-update', {
                username,
                orderNumber: order.orderNumber,
                status: mappedStatus,
                statusMessage,
                itemsTable,
                orderLink: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/orders/${order.id}`,
                supportLink: `${process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000'}/contact`
            });

            await payload.sendEmail({
                to: buyerEmail,
                subject: `Order Update 🚚 | #${order.orderNumber} is ${mappedStatus}`,
                html: emailHtml,
            });
            console.log(`📧 Status update email sent to ${buyerEmail}`);
        }
      } catch (emailErr) {
        console.error("Failed to send status update email:", emailErr);
      }

      revalidatePath(`/orders/${orderId}`);
      revalidatePath(`/seller/orders/${orderId}`);
    }
  }

  return { ok: true, data: { status: currentStatus, history } };
}
