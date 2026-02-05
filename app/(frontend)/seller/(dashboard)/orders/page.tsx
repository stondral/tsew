import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { RecentOrdersTable } from "@/components/seller/RecentOrdersTable";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function SellerOrdersPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin" && (user as any).role !== "sellerEmployee")) {
    redirect("/auth?redirect=/seller/orders");
  }

  // Get sellers where user has order.view permission
  const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
  const allowedSellers = await getSellersWithPermission(payload, user.id, 'order.view');
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (allowedSellers.length === 0 && (user as any).role !== 'admin') {
    redirect("/seller/dashboard");
  }

  // Fetch all products associated with this seller
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsRes = await (payload as any).find({
    collection: "products",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    where: (user as any).role === 'admin' ? {} : {
      seller: { in: allowedSellers },
    },
    limit: 1000,
    overrideAccess: true,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerProductIds = productsRes.docs.map((p: any) => p.id);

  // Fetch all orders containing these products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersRes = await (payload as any).find({
    collection: "orders",
    where: {
      "items.productId": { in: sellerProductIds },
    },
    sort: "-orderDate",
    limit: 100,
    overrideAccess: true,
  });

  // Calculate the total amount for EACH order based ONLY on this seller's items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerOrders = ordersRes.docs.map((order: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerItems = order.items.filter((item: any) => {
      const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      return (user as any).role === 'admin' || allowedSellers.includes(itemSellerId);
    });
    
    const sellerTotal = sellerItems.reduce(
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sum: number, item: any) => sum + (item.priceAtPurchase * item.quantity), 
      0
    );

    return {
      ...order,
      totalAmount: sellerTotal,
      items: sellerItems,
    };
  });

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Order Management</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">
            Manage and track all your customer transactions
          </p>
        </div>
      </div>

      <RecentOrdersTable orders={sellerOrders} />
    </div>
  );
}
