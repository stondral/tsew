import { StatsCards } from "@/components/seller/StatsCards";
import { RevenueChart } from "@/components/seller/RevenueChart";
import { RecentOrdersTable } from "@/components/seller/RecentOrdersTable";
import { BestSellingProducts } from "@/components/seller/BestSellingProducts";
import { Button } from "@/components/ui/button";
import { FileDown, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { getPayload } from "payload";
import config from "@/payload.config";
import { getServerSideUser } from "@/lib/auth";
import { redirect } from "next/navigation";
import { getSellersWithPermission } from "@/lib/rbac/permissions";

interface User {
  id: string;
  role?: string;
  username?: string;
  email?: string;
}

interface Product {
  id: string;
  status?: string;
  createdAt: string;
}

interface OrderItem {
  productId: string;
  seller?: string | { id: string };
  priceAtPurchase: number;
  quantity: number;
}

interface Order {
  id: string;
  orderDate: string;
  items: OrderItem[];
}

export default async function SellerDashboardPage() {
  const user = await getServerSideUser() as User | null;

  if (!user || (user.role !== "seller" && user.role !== "admin" && user.role !== "sellerEmployee")) {
    redirect("/auth?redirect=/seller/dashboard");
  }

  const payload = await getPayload({ config });

  // Get sellers where user has product.view permission
  const allowedSellers = await getSellersWithPermission(payload, user.id, 'product.view');

  if (allowedSellers.length === 0 && user.role !== 'admin') {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-4">
            <h2 className="text-2xl font-black">No organizations found</h2>
            <p className="text-slate-500 max-w-md">You don&apos;t have access to any seller organizations. Please contact support if this is an error.</p>
        </div>
    );
  }

  // Optimize: Fetch essential dashboard data in parallel
  const [productsRes, recentOrdersRes] = await Promise.all([
    payload.find({
        collection: "products" as never,
        where: user.role === 'admin' ? {} : {
          seller: { in: allowedSellers },
        },
        limit: 100,
        overrideAccess: true,
      }),
    payload.find({
        collection: "orders" as never,
        where: {
          and: [
            // Simplified for now, in a real scenario we'd filter by seller in the query if possible
            { orderDate: { greater_than_equal: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString() } }
          ]
        },
        limit: 100,
        sort: "-orderDate",
        depth: 2,
        overrideAccess: true,
      })
  ]);

  const sellerProducts = productsRes.docs as Product[];
  const sellerProductIds = sellerProducts.map((p) => p.id);
  const liveProductsCount = sellerProducts.filter((p) => p.status === 'live').length;

  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartDataMap: Record<string, { name: string, total: number, date: Date }> = {};
  
  for (let i = 6; i >= 0; i--) {
    const date = new Date();
    date.setDate(today.getDate() - i);
    const dayName = days[date.getDay()];
    const dateStr = date.toISOString().split('T')[0];
    chartDataMap[dateStr] = { name: dayName, total: 0, date };
  }

  let currentWeekRevenue = 0;
  let previousWeekRevenue = 0;
  let currentWeekOrders = 0;
  let previousWeekOrders = 0;
  const productSalesMap: Record<string, number> = {};

  const allOrders = recentOrdersRes.docs as Order[];
  
  // High-performance filter and reduction
  const sellerOrders = allOrders.filter(order => {
    const isRelevant = order.items.some(item => {
        const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
        return user.role === 'admin' || allowedSellers.includes(itemSellerId as string) || sellerProductIds.includes(item.productId);
    });
    return isRelevant;
  }).map(order => {
    const orderDate = new Date(order.orderDate);
    const dateStr = orderDate.toISOString().split('T')[0];
    const isCurrentWeek = orderDate >= sevenDaysAgo;
    
    if (isCurrentWeek) currentWeekOrders++;
    else previousWeekOrders++;

    let orderRevenue = 0;
    order.items.forEach((item) => {
        const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
        if (user.role === 'admin' || allowedSellers.includes(itemSellerId as string) || sellerProductIds.includes(item.productId)) {
            const itemRevenue = (item.priceAtPurchase || 0) * (item.quantity || 0);
            orderRevenue += itemRevenue;
            
            if (isCurrentWeek) {
                currentWeekRevenue += itemRevenue;
                if (chartDataMap[dateStr]) chartDataMap[dateStr].total += itemRevenue;
            } else {
                previousWeekRevenue += itemRevenue;
            }
            productSalesMap[item.productId] = (productSalesMap[item.productId] || 0) + (item.quantity || 0);
        }
    });
    return { ...order, totalAmount: orderRevenue };
  });

  const chartData = Object.values(chartDataMap).sort((a, b) => a.date.getTime() - b.date.getTime());

  const calculateGrowth = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? "100%" : "0%";
    const growth = ((current - previous) / previous) * 100;
    return `${growth > 0 ? '+' : ''}${growth.toFixed(1)}%`;
  };

  const revenueGrowth = calculateGrowth(currentWeekRevenue, previousWeekRevenue);
  const ordersGrowth = calculateGrowth(currentWeekOrders, previousWeekOrders);
  
  const currentAOV = currentWeekOrders > 0 ? currentWeekRevenue / currentWeekOrders : 0;
  const previousAOV = previousWeekOrders > 0 ? previousWeekRevenue / previousWeekOrders : 0;
  const aovGrowth = calculateGrowth(currentAOV, previousAOV);

  const newProductsCount = sellerProducts.filter((p) => new Date(p.createdAt) >= sevenDaysAgo).length;

  const topProducts = sellerProducts
    .map((p) => ({ ...p, salesCount: productSalesMap[p.id] || 0 }))
    .sort((a, b) => b.salesCount - a.salesCount)
    .slice(0, 5);

  const stats = [
    { title: "Total Revenue", value: `₹${currentWeekRevenue.toLocaleString()}`, change: revenueGrowth, isPositive: currentWeekRevenue >= previousWeekRevenue, icon: "shopping-bag", color: "amber" },
    { title: "Active Orders", value: currentWeekOrders.toString(), change: ordersGrowth, isPositive: currentWeekOrders >= previousWeekOrders, icon: "activity", color: "indigo" },
    { title: "Live Products", value: liveProductsCount.toString(), change: `+${newProductsCount} new`, isPositive: true, icon: "layout-grid", color: "emerald" },
    { title: "Avg. Order Value", value: `₹${currentAOV.toFixed(0)}`, change: aovGrowth, isPositive: currentAOV >= previousAOV, icon: "plus", color: "slate" },
  ];

  return (
    <div className="space-y-12 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 relative">
        <div className="space-y-2">
            <div className="flex items-center gap-2 text-amber-500 dark:text-amber-400 font-black text-[10px] uppercase tracking-[0.3em]">
                <Sparkles className="h-4 w-4" />
                <span>Premium Seller Dashboard</span>
            </div>
            <h1 className="text-4xl md:text-5xl font-black tracking-tight text-slate-900 dark:text-white leading-none">
                Workspace <span className="text-amber-500 italic">Overview</span>
            </h1>
            <p className="text-slate-500 dark:text-slate-400 font-bold text-sm uppercase tracking-widest pt-2">
                Welcome back, <span className="text-amber-600 dark:text-amber-500 ml-1">{user.username || user.email}</span>
            </p>
        </div>
        
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-black text-[10px] uppercase tracking-[0.2em] gap-2 rounded-2xl h-14 px-8 shadow-sm border-white dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md hover:bg-white dark:hover:bg-slate-800 transition-all dark:text-slate-300">
            <FileDown className="h-4 w-4" /> Export
          </Button>
          <Link href="/seller/products/add">
              <Button className="font-black text-[10px] uppercase tracking-[0.2em] gap-2 rounded-2xl h-14 px-10 bg-amber-500 hover:bg-amber-600 text-white shadow-2xl shadow-amber-500/20 border-none transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-4 w-4" /> New Product
              </Button>
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} />
      
      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <RevenueChart data={chartData} />
        </div>
        <div className="lg:col-span-1">
          <BestSellingProducts products={topProducts} />
        </div>
      </div>

      <div className="w-full pt-4">
          <RecentOrdersTable orders={sellerOrders.slice(0, 15)} />
      </div>
    </div>
  );
}
