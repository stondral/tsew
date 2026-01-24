import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { RecentOrdersTable } from "@/components/seller/RecentOrdersTable";
import { redirect } from "next/navigation";

export default async function SellerOrdersPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
    redirect("/login?redirect=/seller/orders");
  }

  // Fetch all products associated with this seller
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsRes = await (payload as any).find({
    collection: "products",
    where: {
      seller: { equals: user.id },
    },
    limit: 1000,
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
  });

  // Calculate the total amount for EACH order based ONLY on this seller's items
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerOrders = ordersRes.docs.map((order: any) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sellerItems = order.items.filter((item: any) => {
      const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
      return itemSellerId === user.id || sellerProductIds.includes(item.productId);
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
