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

  const { getOrderDetail } = await import("@/lib/redis/order");

  const order = await getOrderDetail(id, async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    return await (payload as any).findByID({
      collection: "orders",
      id,
      depth: 1,
    });
  });

  if (!order || (typeof order.user === 'string' ? order.user : order.user.id) !== user.id) {
    notFound();
  }

  return <OrderDetailClient orderId={id} initialData={order} />;
}
