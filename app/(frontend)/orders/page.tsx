import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { Suspense } from "react";
import OrdersList from "@/components/orders/OrdersList";
import { OrdersListSkeleton } from "@/components/orders/OrdersListSkeleton";
import { getUserOrders } from "@/lib/redis/order";

export default async function MyOrdersPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user) {
    redirect("/auth");
  }

  // Fetch orders inside a separate component or here for Suspense to work if we want to stream
  // For the most "instant" feel, we fetch it here but wrap the list in Suspense if it were a sub-component.
  // Actually, let's make a wrapper for the list to allow streaming.
  
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
            <div className="flex items-center gap-2 md:gap-4">
               <Link href="/profile" className="p-2 hover:bg-white rounded-lg transition-colors border border-transparent hover:border-gray-200">
                  <ArrowLeft className="w-5 h-5 text-gray-600" />
               </Link>
               <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">My Orders</h1>
            </div>
        </div>

        <Suspense fallback={<OrdersListSkeleton />}>
          <OrdersDataWrapper userId={user.id} />
        </Suspense>
      </div>
    </div>
  );
}

async function OrdersDataWrapper({ userId }: { userId: string }) {
  const payload = await getPayload({ config });
  
  const orders = await getUserOrders(userId, 1, async () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (payload as any).find({
      collection: "orders",
      where: {
        user: { equals: userId },
      },
      sort: "-orderDate",
      depth: 1,
      limit: 50,
    });
    return data.docs;
  });

  return <OrdersList orders={orders || []} />;
}
