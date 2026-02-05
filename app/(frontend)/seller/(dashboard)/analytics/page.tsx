import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AnalyticsDashboard } from "@/components/seller/AnalyticsDashboard";
import { Lock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import Link from "next/link";

export const dynamic = 'force-dynamic';

export default async function AnalyticsPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;
  if (!user || (userRole !== "seller" && userRole !== "admin" && userRole !== "sellerEmployee")) {
    redirect("/auth?redirect=/seller/analytics");
  }

  // Get sellers where user has analytics.view permission
  const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
  const allowedSellers = await getSellersWithPermission(payload, user.id, 'analytics.view');

  if (allowedSellers.length === 0 && userRole !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="h-24 w-24 bg-rose-100 rounded-[2rem] flex items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform duration-500">
            <Lock className="h-10 w-10 text-rose-500" />
          </div>
          <div className="absolute -top-2 -right-2 h-8 w-8 bg-amber-50 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Intelligence Restricted</h2>
          <p className="text-slate-500 font-bold leading-relaxed">
            You don&apos;t have permissions to view business analytics. Please <span className="text-amber-600">contact your administrator</span> to enable data insights.
          </p>
        </div>

        <Link href="/seller/dashboard">
          <Button variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
            Back to Dashboard
          </Button>
        </Link>
      </div>
    );
  }

  // Fetch all orders for these sellers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ordersRes = await (payload as any).find({
    collection: "orders",
    where: userRole === 'admin' ? {} : {
      seller: { in: allowedSellers },
    },
    limit: 1000,
    sort: "-createdAt",
    overrideAccess: true,
  });

  // Fetch sellers' products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsRes = await (payload as any).find({
    collection: "products",
    where: userRole === 'admin' ? {} : {
      seller: { in: allowedSellers },
    },
    limit: 1000,
    overrideAccess: true,
  });

  // Calculate analytics data
  const orders = ordersRes.docs;
  const products = productsRes.docs;

  // Get date 30 days ago
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  // Filter orders by time period
  const last30DaysOrders = orders.filter((order: { createdAt: string | number | Date; }) => 
    new Date(order.createdAt) >= thirtyDaysAgo
  );



  // Calculate total revenue
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const totalRevenue = last30DaysOrders.reduce((sum: any, order: { total: any; }) => sum + (order.total || 0), 0);
  
  // Calculate previous period revenue (30-60 days ago)
  const sixtyDaysAgo = new Date();
  sixtyDaysAgo.setDate(sixtyDaysAgo.getDate() - 60);
  
  const previousPeriodOrders = orders.filter((order: { createdAt: string | number | Date; }) => {
    const orderDate = new Date(order.createdAt);
    return orderDate >= sixtyDaysAgo && orderDate < thirtyDaysAgo;
  });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const previousRevenue = previousPeriodOrders.reduce((sum: any, order: { total: any; }) => sum + (order.total || 0), 0);
  const revenueChange = previousRevenue > 0 ? ((totalRevenue - previousRevenue) / previousRevenue) * 100 : 0;

  // Calculate order metrics
  const totalOrders = last30DaysOrders.length;
  const previousOrders = previousPeriodOrders.length;
  const ordersChange = previousOrders > 0 ? ((totalOrders - previousOrders) / previousOrders) * 100 : 0;

  // Average order value
  const averageOrderValue = totalOrders > 0 ? totalRevenue / totalOrders : 0;

  // Active products
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const activeProducts = products.filter((p: { isActive: any; }) => p.isActive).length;

  // Unique customers
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const uniqueCustomers = new Set(last30DaysOrders.map((order: { customer: any; }) => 
    typeof order.customer === 'object' ? order.customer?.id : order.customer
  ).filter(Boolean)).size;

  // Revenue over time (last 30 days)
  const revenueByDate: { [key: string]: number } = {};
  last30DaysOrders.forEach((order: { createdAt: string | number | Date; total: number; }) => {
    const date = new Date(order.createdAt).toISOString().split('T')[0];
    revenueByDate[date] = (revenueByDate[date] || 0) + (order.total || 0);
  });

  const revenueOverTime = Object.entries(revenueByDate)
    .map(([date, revenue]) => ({ date, revenue }))
    .sort((a, b) => a.date.localeCompare(b.date));

  // Revenue by category
  const revenueByCategory: { [key: string]: number } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last30DaysOrders.forEach((order: { items: any[]; total: number; }) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: { product: { category: { name: string; }; }; }) => {
        const categoryName = typeof item.product?.category === 'object' 
          ? item.product.category?.name 
          : 'Uncategorized';
        
        if (categoryName) {
          const itemRevenue = order.total / order.items.length; // Simple split
          revenueByCategory[categoryName] = (revenueByCategory[categoryName] || 0) + itemRevenue;
        }
      });
    }
  });

  const categoryData = Object.entries(revenueByCategory)
    .map(([category, revenue]) => ({ category, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Orders by status
  const ordersByStatus: { [key: string]: number } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last30DaysOrders.forEach((order: { status: any; }) => {
    const status = order.status || 'pending';
    ordersByStatus[status] = (ordersByStatus[status] || 0) + 1;
  });

  const statusData = Object.entries(ordersByStatus).map(([status, count]) => ({ 
    status: status.charAt(0).toUpperCase() + status.slice(1), 
    count 
  }));

  // Top products by revenue
  const productRevenue: { [key: string]: { revenue: number; orders: number; name: string } } = {};
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  last30DaysOrders.forEach((order: { items: any[]; total: number; }) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: { product: { id: string; name: string; }; }) => {
        const productId = typeof item.product === 'object' ? item.product?.id : item.product;
        const productName = typeof item.product === 'object' ? item.product?.name : 'Unknown';
        
        if (productId) {
          if (!productRevenue[productId]) {
            productRevenue[productId] = { revenue: 0, orders: 0, name: productName };
          }
          const itemRevenue = order.total / order.items.length;
          productRevenue[productId].revenue += itemRevenue;
          productRevenue[productId].orders += 1;
        }
      });
    }
  });

  const topProducts = Object.entries(productRevenue)
    .map(([id, data]) => ({ id, ...data }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  // Orders over time (last 30 days)
  const ordersByDate: { [key: string]: number } = {};
  last30DaysOrders.forEach((order: { createdAt: string | number | Date; }) => {
    const date = new Date(order.createdAt).toISOString().split('T')[0];
    ordersByDate[date] = (ordersByDate[date] || 0) + 1;
  });

  const ordersOverTime = Object.entries(ordersByDate)
    .map(([date, orders]) => ({ date, orders }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const analyticsData = {
    metrics: {
      totalRevenue,
      revenueChange,
      totalOrders,
      ordersChange,
      averageOrderValue,
      conversionRate: 0, // Placeholder - would need page view data
      activeProducts,
      totalCustomers: uniqueCustomers,
    },
    revenueOverTime,
    revenueByCategory: categoryData,
    ordersByStatus: statusData,
    topProducts,
    ordersOverTime,
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Analytics Dashboard</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">
            Track your business performance
          </p>
        </div>
      </div>

      <AnalyticsDashboard data={analyticsData} />
    </div>
  );
}
