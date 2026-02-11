"use server";

import { acceptOrder } from "@/lib/orders";
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import type { ExtendedUser } from "@/lib/seller";

interface OrderItem {
  productName: string;
  productImage?: {
    id: string;
    url: string;
    alt?: string;
  };
  quantity: number;
}

export async function acceptOrderAction(
  orderId: string, 
  deliveryData: { 
    provider: string, 
    cost: number, 
    gst: number, 
    pickupWarehouse: string,
    overrides?: { gm?: number, l?: number, b?: number, h?: number, md?: 'S' | 'E' }
  }
) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user || ((user as unknown as ExtendedUser).role !== 'seller' && (user as unknown as ExtendedUser).role !== 'admin')) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    let trackingId: string | undefined;
    let carrierResponse: unknown;

    if (deliveryData.provider === "Delhivery") {
       const { createShipment, schedulePickup } = await import("@/lib/delhivery");
       
       // 1. Fetch full data for manifestation
       const order = await payload.findByID({
         collection: "orders",
         id: orderId,
         depth: 1,
         overrideAccess: true,
       }) as unknown as { 
         id: string; 
         orderNumber?: string; 
         total: number; 
         paymentMethod: string; 
         paymentStatus: string; 
         shippingAddress: string | { fullName?: string; name?: string; phoneNumber?: string; postalCode: string; addressLine1: string; addressLine2?: string; city: string; state: string };
         items: Array<OrderItem>;
       };

       const warehouse = await payload.findByID({
         collection: "warehouses",
         id: deliveryData.pickupWarehouse,
         overrideAccess: true,
       }) as unknown as { label: string; postalCode: string; phone?: string; address?: string; city?: string; email?: string };

       const address = typeof order.shippingAddress === 'object' ? order.shippingAddress : await payload.findByID({
         collection: "addresses",
         id: order.shippingAddress as string,
         overrideAccess: true,
       }) as unknown as { fullName?: string; name?: string; phoneNumber?: string; postalCode: string; addressLine1: string; addressLine2?: string; city: string; state: string };

       if (!order || !warehouse || !address) {
         throw new Error("Missing order, warehouse, or address data for shipment creation");
       }

        if (!warehouse.label || !address.postalCode) {
           throw new Error("Critical shipping data missing: Warehouse Label or Destination Pincode");
        }

       // Calculate dimensions string
       const dims = deliveryData.overrides 
         ? `${deliveryData.overrides.l || 20}*${deliveryData.overrides.b || 15}*${deliveryData.overrides.h || 5}`
         : "20*15*5";
 
        const getShipmentPayload = () => {
          // Build complete address string safely
          const addressParts = [];
          if (address.addressLine1) addressParts.push(address.addressLine1);
          if (address.addressLine2) addressParts.push(address.addressLine2);
          if (address.city) addressParts.push(address.city);
          if (address.state) addressParts.push(address.state);
          const completeAddress = addressParts.length > 0 ? addressParts.join(", ") : "N/A";
          
          const isCOD = order.paymentMethod === 'cod' && order.paymentStatus !== 'paid';
          
          const shipmentPayload = {
            pickup_location: warehouse.label,
            origin: warehouse.postalCode, // Pincode for origin
            consignee: address.fullName || address.name || "Customer",
            name: address.fullName || address.name || "Customer",
            add: completeAddress,
            pin: address.postalCode,
            phone: address.phoneNumber || "0000000000",
            order: order.orderNumber || order.id,
            payment_mode: isCOD ? ('COD' as const) : ('Prepaid' as const),
            amount: isCOD ? String(order.total) : '0', // COD amount for collection
            cod_amount: isCOD ? String(order.total) : undefined, // Explicitly set cod_amount for COD orders
            weight: String(deliveryData.overrides?.gm || 500),
            shipping_mode: (deliveryData.overrides?.md === 'S' ? 'Surface' : 'Express') as "Surface" | "Express",
            products_desc: order.items.map((i: OrderItem) => `${i.productName} (x${i.quantity})`).join(", "),
            dimensions: dims,
            client: "STOND EMPORIUM"
          };
          
          return shipmentPayload;
        };

        const finalPayload = getShipmentPayload();
        console.log("🚛 Final Manifestation Payload being sent:", JSON.stringify(finalPayload, null, 2));
        console.log(`💳 Order Payment Mode: ${finalPayload.payment_mode === 'COD' ? `COD (Collection Amount: ₹${finalPayload.amount})` : 'Prepaid'}`);

        // Validate all required fields before sending to Delhivery
        const requiredFields = ['pickup_location', 'pin', 'order', 'add', 'name', 'phone'];
        const missingFields = requiredFields.filter(field => !finalPayload[field as keyof typeof finalPayload]);
        
        if (missingFields.length > 0) {
           throw new Error(`Manifestation payload is incomplete. Missing fields: ${missingFields.join(', ')}`);
        }

        if (!finalPayload.pickup_location || !finalPayload.pin || !finalPayload.order) {
           throw new Error("Manifestation payload is incomplete (missing location, pin, or order number)");
        }

        // Pre-register warehouse if not already registered
        console.log("🔧 Ensuring warehouse is registered with Delhivery...");
        const { registerWarehouse } = await import("@/lib/delhivery");
        const warehouseRegResult = await registerWarehouse({
          name: warehouse.label,
          phone: warehouse.phone || "9999999999",
          address: warehouse.address || "N/A",
          city: warehouse.city || "Mumbai",
          pin: warehouse.postalCode,
          email: warehouse.email || "noreply@stond.com"
        });
        
        if (warehouseRegResult.success) {
          console.log("✅ Warehouse is registered with Delhivery", warehouseRegResult.already_registered ? "(already existed)" : "(newly registered)");
        } else {
          console.warn("⚠️ Warehouse registration status:", warehouseRegResult.message || "Unknown status");
        }

        // Create Shipment (Try 1)
        let shipmentResult = await createShipment(finalPayload);

        // Self-healing: If warehouse not found, try registering it and retry
        if (shipmentResult && !shipmentResult.success && (
          shipmentResult.rmk?.includes("ClientWarehouse matching query does not exist") || 
          shipmentResult.rmk?.includes("shipment list contains no data")
        )) {
          console.warn("🚨 Warehouse issue detected. Attempting re-registration for:", warehouse.label);
          const reregResult = await registerWarehouse({
            name: warehouse.label,
            phone: warehouse.phone || "9999999999",
            address: warehouse.address || "N/A",
            city: warehouse.city || "Mumbai",
            pin: warehouse.postalCode,
            email: warehouse.email || "noreply@stond.com"
          });
          
          console.log("Re-registration result:", reregResult);
          console.log("Retrying Delhivery manifestation after re-registration...");
          
          // Wait a moment for the warehouse to be registered
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          shipmentResult = await createShipment(finalPayload);
        }

        if (!shipmentResult || !shipmentResult.success) {
          console.error("Delhivery manifestation failed:", JSON.stringify(shipmentResult, null, 2));
          
          // Provide user-friendly error messages based on error type
          let userMessage = "Failed to create Delhivery shipment. ";
          
          if (shipmentResult?.errorType === 'INSUFFICIENT_BALANCE') {
            userMessage = "❌ Insufficient balance in your Delhivery prepaid account. Please add credits to continue. Contact: client.support@delhivery.com";
          } else if (shipmentResult?.rmk?.includes('insufficient balance')) {
            userMessage = "❌ Insufficient balance in your Delhivery prepaid account. Please add credits to continue.";
          } else if (shipmentResult?.rmk?.includes('already exists')) {
            userMessage = "Warehouse already registered. " + (shipmentResult?.rmk || "Please try again.");
          } else if (shipmentResult?.rmk?.includes('not found') || shipmentResult?.rmk?.includes('does not exist')) {
            userMessage = "Warehouse not found in Delhivery. Please ensure the warehouse is properly registered.";
          } else if (shipmentResult?.rmk?.includes('ConversionError')) {
            userMessage = "Invalid shipment data format. Please check dimensions and weight.";
          } else {
            userMessage = shipmentResult?.rmk || "Delhivery manifestation failed. Please check parameters.";
          }
          
          console.error("User-facing error message:", userMessage);
          throw new Error(userMessage);
        }

       trackingId = shipmentResult.packages?.[0]?.waybill;
       carrierResponse = shipmentResult;

       if (!trackingId) {
         console.error("Delhivery manifestation succeeded but no tracking ID was returned:", JSON.stringify(shipmentResult, null, 2));
         throw new Error("Delhivery manifestation succeeded but no tracking ID was returned.");
       }

       // 2. Schedule Pickup
       await schedulePickup({
         pickup_location: warehouse.label,
         pickup_date: new Date().toISOString().split('T')[0],
         pickup_time: "14:00:00"
       });
    }

    // 3. Complete local order acceptance
    await acceptOrder(orderId, user.id, {
      ...deliveryData,
      trackingId,
      carrierResponse: carrierResponse as Record<string, unknown>
    });

    revalidatePath("/seller/orders/incoming");
    return { ok: true, trackingId };

  } catch (error: unknown) {
    console.error("Failed to accept order:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to accept order" };
  }
}

export async function getDelhiveryStatsAction(
  orderId: string, 
  warehouseId: string, 
  overrides?: { gm?: number; l?: number; b?: number; h?: number; md?: 'S' | 'E' }
) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user || ((user as unknown as ExtendedUser).role !== 'seller' && (user as unknown as ExtendedUser).role !== 'admin')) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const order = await payload.findByID({
      collection: "orders",
      id: orderId,
      overrideAccess: true,
    }) as unknown as { items: Array<{ productId: string; quantity: number }>; shippingAddress: string | Record<string, unknown>; paymentMethod: string; paymentStatus: string };

    if (!order) throw new Error("Order not found");

    const warehouse = await payload.findByID({
      collection: "warehouses",
      id: warehouseId,
      overrideAccess: true,
    }) as unknown as { postalCode: string };

    if (!warehouse) throw new Error("Warehouse not found");

    const address = typeof order.shippingAddress === 'object' ? order.shippingAddress : await payload.findByID({
      collection: "addresses",
      id: order.shippingAddress,
      overrideAccess: true,
    }) as unknown as { postalCode: string };

    if (!address) throw new Error("Shipping address not found");

    // Calculate total weight (default to 500g per item if missing)
    let calculatedWeight = 0;
    for (const item of order.items) {
      const product = await payload.findByID({
        collection: "products",
        id: item.productId,
        overrideAccess: true,
      }) as unknown as { weight?: number };
      calculatedWeight += (product?.weight || 500) * item.quantity;
    }

    const totalWeight = overrides?.gm || calculatedWeight;
    const movementType = overrides?.md || 'E';
    
    // Normalize dimensions: enforce 20x15x5 minimum if missing or 0
    const finalL = (overrides?.l && overrides.l > 0) ? overrides.l : 20;
    const finalB = (overrides?.b && overrides.b > 0) ? overrides.b : 15;
    const finalH = (overrides?.h && overrides.h > 0) ? overrides.h : 5;

    // Volumetric mismatch guard
    const volumetricWeightG = (finalL * finalB * finalH) / 5;
    if (volumetricWeightG > totalWeight * 3) {
      console.warn("🚨 [VOLUMETRIC ALERT]: Suspicious dimensions detected.", {
        actualWeight: `${totalWeight}g`,
        volumetricWeight: `${volumetricWeightG}g`,
        dimensions: `${finalL}x${finalB}x${finalH}cm`,
        ratio: (volumetricWeightG / totalWeight).toFixed(2),
        message: "Volumetric weight is > 3x actual weight. Please check if dims are in cm (not mm) or if the item is extremely light for its size."
      });
    }

    const { getExpectedTAT, calculateShippingCost } = await import("@/lib/delhivery");

    const tat = await getExpectedTAT({
      origin_pin: String(warehouse.postalCode),
      destination_pin: String(address.postalCode),
      weight: totalWeight, // Added weight
      mot: movementType === 'E' ? 'E' : 'S'
    }) as unknown as { data: Array<{ expected_delivery_date: string }> };

    const costResult = await calculateShippingCost({
      md: movementType,
      gm: totalWeight,
      o_pincode: String(warehouse.postalCode),
      d_pincode: String(address.postalCode),
      ss: 'Delivered',
      pt: (order.paymentMethod === 'cod' && order.paymentStatus !== 'paid') ? 'COD' : 'Pre-paid',
      l: finalL,
      b: finalB,
      h: finalH
    });

    const cost = costResult as unknown as Array<Record<string, unknown>> | Record<string, unknown>;

    console.log("Delhivery Stats Request Params:", {
      o_pincode: warehouse.postalCode,
      d_pincode: address.postalCode,
      weight: totalWeight,
      md: movementType,
      dimensions: { l: finalL, b: finalB, h: finalH },
      paymentMethod: order.paymentMethod
    });

    console.log("Delhivery RAW response:", JSON.stringify(cost, null, 2));

    const delhiveryData = Array.isArray(cost) ? cost[0] : cost as Record<string, unknown>;
    const shippingCost = (delhiveryData?.total_amount as number) ?? (delhiveryData?.gross_amount as number) ?? (delhiveryData?.shipping_cost as number) ?? 0;

    if (shippingCost === 0) {
      console.warn("Delhivery returned ₹0 cost. Request parameters summary:", {
        o_pin: warehouse.postalCode,
        d_pin: address.postalCode,
        cgm: totalWeight, // or the calculated cgm if logged
        raw: delhiveryData
      });
      return { success: false, error: "Shipping cost calculation failed (returned 0). Pincodes may not be serviceable for this mode." };
    }

    if (!delhiveryData || shippingCost === undefined) {
      console.error("Delhivery partial response or missing cost field:", delhiveryData);
      return { ok: false, error: "Failed to fetch live shipping cost from Delhivery" };
    }

    const expectedDelivery = tat?.data?.[0]?.expected_delivery_date || null;

    if (!expectedDelivery) {
      console.warn("Delhivery TAT API did not return an expected delivery date for this route.", {
        origin: warehouse.postalCode,
        dest: address.postalCode,
        raw: tat
      });
    }

    return { 
      ok: true, 
      data: { 
        cost: shippingCost, 
        expectedDelivery: expectedDelivery,
        totalWeight
      } 
    };
  } catch (error: unknown) {
    console.error("Failed to fetch Delhivery stats:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to fetch delivery stats" };
  }
}

export async function updateOrderAddressAction(orderId: string, data: { 
  firstName: string; 
  lastName: string; 
  phone: string; 
  address: string; 
  apartment?: string; 
  city: string; 
  state: string; 
  postalCode: string; 
}) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user || ((user as unknown as ExtendedUser).role !== 'seller' && (user as unknown as ExtendedUser).role !== 'admin')) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const order = await payload.findByID({
      collection: "orders",
      id: orderId,
      depth: 0,
    }) as unknown as { status: string; shippingAddress: string };

    if (!order) {
      return { ok: false, error: "Order not found" };
    }

    // Allow updates only if not shipped yet
    const restrictedStatuses = ['SHIPPED', 'DELIVERED', 'CANCELLED'];
    if (restrictedStatuses.includes(order.status)) {
      return { ok: false, error: `Address cannot be updated for orders with status: ${order.status}` };
    }

    if (typeof order.shippingAddress === 'string') {
      await payload.update({
        collection: "addresses",
        id: order.shippingAddress,
        data: {
          firstName: data.firstName,
          lastName: data.lastName,
          phoneNumber: data.phone,
          addressLine1: data.address,
          addressLine2: data.apartment || "",
          city: data.city,
          state: data.state,
          postalCode: data.postalCode,
        },
      });
    } else {
      return { ok: false, error: "Invalid address reference on order" };
    }

    revalidatePath(`/seller/orders/${orderId}`);
    return { ok: true };
  } catch (error: unknown) {
    console.error("Failed to update order address:", error);
    return { ok: false, error: error instanceof Error ? error.message : "Failed to update address" };
  }
}

export async function searchOrderAction(query: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  if (!user || ((user as unknown as ExtendedUser).role !== 'seller' && (user as unknown as ExtendedUser).role !== 'admin')) {
    return { ok: false, error: "Unauthorized" };
  }

  try {
    const orders = await payload.find({
      collection: "orders",
      where: {
        or: [
          { orderNumber: { equals: query } },
          { id: { equals: query } }
        ]
      },
      limit: 1,
      depth: 0,
    });

    if (orders.docs.length > 0) {
      return { ok: true, id: orders.docs[0].id };
    }

    return { ok: false, error: "Order not found" };
  } catch (error: unknown) {
    console.error("Order search failed:", error);
    return { ok: false, error: "Search failed" };
  }
}
