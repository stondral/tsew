import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { NextResponse } from "next/server";

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
  orderDate: string;
  items: OrderItem[];
}

export async function GET() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  if (!user || ((user as User).role !== "seller" && (user as User).role !== "admin" && (user as User).role !== "sellerEmployee")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get sellers where user has product.view permission
  const { getSellersWithPermission } = await import('@/lib/rbac/permissions');
  const allowedSellers = await getSellersWithPermission(payload, user.id, 'product.view');

  if (allowedSellers.length === 0 && (user as User).role !== 'admin') {
    return NextResponse.json({ error: "No seller organizations found" }, { status: 403 });
  }

  // Fetch products to get counts and IDs
  const productsRes = await payload.find({
    collection: "products" as never,
    where: (user as User).role === 'admin' ? {} : {
      seller: { in: allowedSellers },
    },
    limit: 100,
    overrideAccess: true,
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any

  const sellerProducts = productsRes.docs as Product[];
  const sellerProductIds = sellerProducts.map((p) => p.id);
  const liveProductsCount = sellerProducts.filter((p) => p.status === 'live').length;

  // Fetch orders from the last 14 days to calculate growth
  const fourteenDaysAgo = new Date();
  fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

  const recentOrdersRes = await payload.find({
    collection: "orders" as never,
    where: {
      and: [
        { "items.productId": { in: sellerProductIds } },
        { orderDate: { greater_than_equal: fourteenDaysAgo.toISOString() } }
      ]
    },
    limit: 100,
    sort: "-orderDate",
    depth: 2,
    overrideAccess: true,
  }) as any; // eslint-disable-line @typescript-eslint/no-explicit-any



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

  const orders = recentOrdersRes.docs as Order[];
  orders.forEach((order) => {
    const orderDate = new Date(order.orderDate);
    const dateStr = orderDate.toISOString().split('T')[0];
    const isCurrentWeek = orderDate >= sevenDaysAgo;
    
    if (isCurrentWeek) currentWeekOrders++;
    else previousWeekOrders++;

    order.items.forEach((item) => {
      const itemSellerId = typeof item.seller === 'string' ? item.seller : item.seller?.id;
      if ((user as User).role === 'admin' || allowedSellers.includes(itemSellerId as string) || sellerProductIds.includes(item.productId)) {
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

  const chartData = Object.values(chartDataMap).sort((a, b) => a.date.getTime() - b.date.getTime());

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
  const newProductsCount = sellerProducts.filter((p) => new Date(p.createdAt) >= sevenDaysAgo).length;

  const topProducts = sellerProducts
    .map((p) => ({
      ...p,
      salesCount: productSalesMap[p.id] || 0
    }))
    .sort((a, b) => b.salesCount - a.salesCount)
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
      value: `₹${currentAOV.toFixed(0)}`, 
      change: aovGrowth, 
      isPositive: currentAOV >= previousAOV, 
      icon: "plus", 
      color: "slate" 
    },
  ];

  return NextResponse.json({
    stats,
    chartData,
    orders,
    topProducts,
    user: {
      username: (user as User).username,
      email: user.email,
      id: user.id
    }
  });
}
