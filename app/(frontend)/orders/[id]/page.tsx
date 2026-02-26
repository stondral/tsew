// app/(frontend)/orders/[id]/page.tsx
import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { notFound, redirect } from "next/navigation";
import OrderDetailClient from "./OrderDetailClient";

interface PageProps {
  params: Promise<{ id: string }>;
}

export default async function OrderDetailsPage({ params }: PageProps) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    redirect("/auth");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const order = await (payload as any).findByID({
    collection: "orders",
    id,
    depth: 1,
  });

  if (!order || (typeof order.user === 'string' ? order.user : order.user.id) !== user.id) {
    notFound();
  }

  // Backfill images if missing
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (order.items.some((item: any) => !item.productImage)) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await Promise.all(order.items.map(async (item: any) => {
      if (item.productImage) return;
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const product = await (payload as any).findByID({
          collection: "products",
          id: item.productId,
          depth: 1,
        });
        if (product?.media?.[0]) {
          const media = product.media[0];
          item.productImage = typeof media === "object" ? (media.sizes?.thumbnail?.url || media.url || "") : "";
        }
      } catch (e) {
        console.error("Backfill error", e);
      }
    }));
  }

  return <OrderDetailClient orderId={id} initialData={order} />;
}
