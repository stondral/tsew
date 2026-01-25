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
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const orders = await (payload as any).find({
      collection: "orders",
      where: {
        user: { equals: user.id },
      },
      sort: "-orderDate",
      depth: 2, // Populate products for image backfilling
    });

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const enrichedOrders = await Promise.all(orders.docs.map(async (order: any) => {
      // If we already have images saved in the order items, just return
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (order.items.every((item: any) => item.productImage)) return order;

      // Backfill images for old orders
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const enrichedItems = await Promise.all(order.items.map(async (item: any) => {
        if (item.productImage) return item;

        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const product = await (payload as any).findByID({
            collection: "products",
            id: item.productId,
            depth: 1,
          });
          
          let image = "";
          if (product?.media?.[0]) {
            const media = product.media[0];
            image = typeof media === "object" ? (media.sizes?.thumbnail?.url || media.url || "") : "";
          }

          return { ...item, productImage: image };
        } catch {
          return item;
        }
      }));

      return { ...order, items: enrichedItems };
    }));

    return NextResponse.json({
      orders: enrichedOrders,
    });
  } catch (e) {
    console.error("Failed to list orders", e);
    return NextResponse.json({ error: "Failed to fetch orders" }, { status: 500 });
  }
}
