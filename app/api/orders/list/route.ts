// app/api/orders/list/route.ts
import { getPayload } from "payload";
import config from "@/payload.config";
import { NextRequest, NextResponse } from "next/server";
import { headers } from "next/headers";

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export async function GET(_req: NextRequest) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { getUserOrders } = await import("@/lib/redis/order");

    const ordersData = await getUserOrders(user.id, 1, async () => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await (payload as any).find({
        collection: "orders",
        where: {
          user: { equals: user.id },
        },
        sort: "-orderDate",
        depth: 1, // Reduced depth for list performance
        limit: 50,
      });
      return data.docs;
    });

    return NextResponse.json({
      orders: ordersData || [],
    });
  } catch (e) {
    console.error("Failed to list orders", e);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
