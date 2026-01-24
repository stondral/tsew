import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";

import { StatsCards } from "@/components/seller/StatsCards";
import { RevenueChart } from "@/components/seller/RevenueChart";
import { RecentOrdersTable } from "@/components/seller/RecentOrdersTable";
import { BestSellingProducts } from "@/components/seller/BestSellingProducts";
import { Button } from "@/components/ui/button";
import { FileDown, Plus } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export default async function SellerDashboardPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
    redirect("/login?redirect=/seller/dashboard");
  }

  // Fetch products to get counts and IDs
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsRes = await (payload as any).find({
    collection: "products",
    where: {
      seller: { equals: user.id },
    },
    limit: 100,
  });

  const sellerProducts = productsRes.docs;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const sellerProductIds = sellerProducts.map((p: any) => p.id);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const liveProductsCount = sellerProducts.filter((p: any) => p.status === 'live').length;

  // Fetch orders from the last 14 days to calculate growth
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recentOrdersRes = await (payload as any).find({
    collection: "orders",
    where: {
      and: [
        { "items.productId": { in: sellerProductIds } },
        { orderDate: { greater_than_equal: fourteenDaysAgo.toISOString() } }
      ]
    },
    limit: 100,
    sort: "-orderDate",
  });

  const orders = recentOrdersRes.docs;

  // 1. Prepare chart data and calculate growth
  const today = new Date();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(today.getDate() - 7);
  
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const chartDataMap: Record<string, { name: string, total: number, date: Date }> = {};
  
  // Initialize last 7 days for the chart
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

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  orders.forEach((order: any) => {
    const orderDate = new Date(order.orderDate);
    const dateStr = orderDate.toISOString().split('T')[0];
    const isCurrentWeek = orderDate >= sevenDaysAgo;
    
    if (isCurrentWeek) currentWeekOrders++;
    else previousWeekOrders++;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order.items.forEach((item: any) => {
      const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
      if (itemSellerId === user.id || sellerProductIds.includes(item.productId)) {
        const itemRevenue = (item.priceAtPurchase || 0) * (item.quantity || 0);
        
        if (isCurrentWeek) {
            currentWeekRevenue += itemRevenue;
            // Add to chart if within last 7 days
            if (chartDataMap[dateStr]) {
              chartDataMap[dateStr].total += itemRevenue;
            }
        } else {
            previousWeekRevenue += itemRevenue;
        }
        
        // Track sales per product
        productSalesMap[item.productId] = (productSalesMap[item.productId] || 0) + (item.quantity || 0);
      }
    });
  });

  const chartData = Object.values(chartDataMap).sort((a: { date: Date }, b: { date: Date }) => a.date.getTime() - b.date.getTime());

  // Growth calculations
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

  // New products in last 7 days
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const newProductsCount = sellerProducts.filter((p: any) => new Date(p.createdAt) >= sevenDaysAgo).length;

  const topProducts = sellerProducts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((p: any) => ({
      ...p,
      salesCount: productSalesMap[p.id] || 0
    }))
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .sort((a: any, b: any) => (b as any).salesCount - (a as any).salesCount)
    .slice(0, 5);

  const stats = [
    { 
      title: "Total Revenue", 
      value: `₹${currentWeekRevenue.toLocaleString()}`, 
      change: revenueGrowth, 
      isPositive: currentWeekRevenue >= previousWeekRevenue, 
      icon: "shopping-bag", 
      color: "amber" 
    },
    { 
      title: "Active Orders", 
      value: currentWeekOrders.toString(), 
      change: ordersGrowth, 
      isPositive: currentWeekOrders >= previousWeekOrders, 
      icon: "activity", 
      color: "indigo" 
    },
    { 
      title: "Live Products", 
      value: liveProductsCount.toString(), 
      change: `+${newProductsCount} new`, 
      isPositive: true, 
      icon: "layout-grid", 
      color: "emerald" 
    },
    { 
      title: "Avg. Order Value", 
      value: `₹${currentAOV.toFixed(2)}`, 
      change: aovGrowth, 
      isPositive: currentAOV >= previousAOV, 
      icon: "plus", 
      color: "slate" 
    },
  ];

  // ... (stats, chartData, topProducts calculations remain same)

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Workspace Overview</h1>
          {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">Welcome back, <span className="text-amber-600">{(user as any).username || user.email}</span></p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline" className="font-black text-xs uppercase tracking-widest gap-2 rounded-2xl h-12 px-6 shadow-sm border-slate-200 hover:bg-white transition-all">
            <FileDown className="h-4 w-4" /> Export Analytics
          </Button>
          <Link href="/seller/products/add">
              <Button className="font-black text-xs uppercase tracking-widest gap-2 rounded-2xl h-12 px-8 bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 border-none transition-all hover:scale-105 active:scale-95">
                  <Plus className="h-4 w-4" /> New Product
              </Button>
          </Link>
        </div>
      </div>

      <StatsCards stats={stats} />
      
      <div className="grid gap-10 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-10">
          <RevenueChart data={chartData} />
          <RecentOrdersTable orders={orders.slice(0, 10)} />
        </div>
        <div className="lg:col-span-1">
          <BestSellingProducts products={topProducts} />
        </div>
      </div>
    </div>
  );
}
