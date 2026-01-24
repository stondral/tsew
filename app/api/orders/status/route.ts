// app/api/orders/status/route.ts
import { getPayload } from "payload";
import config from "@/payload.config";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const orderId = searchParams.get("orderId");

  if (!orderId) {
    return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
  }

  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const order = await (payload as any).findByID({
      collection: "orders",
      id: orderId,
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Check ownership
    const orderUserId = typeof order.user === 'object' ? order.user.id : order.user;
    if (orderUserId !== user.id) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    return NextResponse.json({
      paymentStatus: order.paymentStatus,
      status: order.status,
      paymentMethod: order.paymentMethod,
    });
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_e) {
    return NextResponse.json({ error: "Failed to fetch order status" }, { status: 500 });
  }
}
