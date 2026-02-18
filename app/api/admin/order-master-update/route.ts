import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";
import { logger } from "@/lib/logger";

export async function POST(req: Request) {
  try {
    const payload = await getPayload({ config });
    const requestHeaders = await headers();
    const { user } = await payload.auth({ headers: requestHeaders });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: "Unauthorized - Admin Access Required" }, { status: 401 });
    }

    const body = await req.json();
    const {
      orderId,
      status,
      paymentStatus,
      shippingAddress,
      pickupWarehouse
    } = body;

    if (!orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    // 1. Update Shipping Address if provided
    if (shippingAddress && shippingAddress.id) {
      await payload.update({
        collection: 'addresses',
        id: shippingAddress.id,
        data: {
          firstName: shippingAddress.firstName,
          lastName: shippingAddress.lastName,
          email: shippingAddress.email,
          phone: shippingAddress.phone,
          address: shippingAddress.address,
          city: shippingAddress.city,
          state: shippingAddress.state,
          postalCode: shippingAddress.postalCode,
        },
        overrideAccess: true,
      });
    }

    // 2. Update Pickup Warehouse if provided
    if (pickupWarehouse && pickupWarehouse.id) {
      await payload.update({
        collection: 'warehouses',
        id: pickupWarehouse.id,
        data: {
          label: pickupWarehouse.label,
          firstName: pickupWarehouse.firstName,
          lastName: pickupWarehouse.lastName,
          phone: pickupWarehouse.phone,
          address: pickupWarehouse.address,
          city: pickupWarehouse.city,
          state: pickupWarehouse.state,
          postalCode: pickupWarehouse.postalCode,
        },
        overrideAccess: true,
      });
    }

    // 3. Update Order Level Data
    const updatedOrder = await payload.update({
      collection: 'orders',
      id: orderId,
      data: {
        ...(status && { status }),
        ...(paymentStatus && { paymentStatus }),
      },
      overrideAccess: true,
    });

    return NextResponse.json({
      success: true,
      message: "Order Master updated successfully",
      order: updatedOrder
    });

  } catch (error: unknown) {
    logger.error({ err: error }, "Master Update Error");
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
