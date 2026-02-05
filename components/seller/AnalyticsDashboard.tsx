"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  TrendingUp, 
  DollarSign, 
  ShoppingCart, 
  Package, 
  Users,
  ArrowUpRight,
  ArrowDownRight
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface AnalyticsData {
  metrics: {
    totalRevenue: number;
    revenueChange: number;
    totalOrders: number;
    ordersChange: number;
    averageOrderValue: number;
    conversionRate: number;
    activeProducts: number;
    totalCustomers: number;
  };
  revenueOverTime: Array<{ date: string; revenue: number }>;
  revenueByCategory: Array<{ category: string; revenue: number }>;
  ordersByStatus: Array<{ status: string; count: number }>;
  topProducts: Array<{ name: string; revenue: number; orders: number }>;
  ordersOverTime: Array<{ date: string; orders: number }>;
}

interface AnalyticsDashboardProps {
  data: AnalyticsData;
}

const COLORS = {
  primary: "#f59e0b", // amber-500
  secondary: "#10b981", // emerald-500
  tertiary: "#6366f1", // indigo-500
  quaternary: "#a855f7", // purple-500
  danger: "#f43f5e", // rose-500
};

const PIE_COLORS = ["#f59e0b", "#10b981", "#6366f1", "#a855f7", "#f43f5e", "#ec4899"];

export function AnalyticsDashboard({ data }: AnalyticsDashboardProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-IN", { month: "short", day: "numeric" });
  };

  const MetricCard = ({
    title,
    value,
    change,
    icon: Icon,
    color,
    prefix = "",
    suffix = "",
  }: {
    title: string;
    value: number | string;
    change?: number;
    icon: React.ElementType;
    color: string;
    prefix?: string;
    suffix?: string;
  }) => (
    <Card className="border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2rem] overflow-hidden">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className={cn("p-3 rounded-2xl", color)}>
            <Icon className="h-6 w-6 text-white" />
          </div>
          {change !== undefined && (
            <div className={cn(
              "flex items-center gap-1 text-xs font-black uppercase tracking-wider px-3 py-1 rounded-full",
              change >= 0 ? "bg-emerald-50 text-emerald-600" : "bg-rose-50 text-rose-600"
            )}>
              {change >= 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
              {Math.abs(change).toFixed(1)}%
            </div>
          )}
        </div>
        <div>
          <p className="text-3xl font-black text-slate-900 mb-1">
            {prefix}{typeof value === 'number' ? value.toLocaleString() : value}{suffix}
          </p>
          <p className="text-xs font-black uppercase tracking-widest text-slate-400">{title}</p>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-8">
      {/* Metrics Grid */}
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Total Revenue"
          value={formatCurrency(data.metrics.totalRevenue)}
          change={data.metrics.revenueChange}
          icon={DollarSign}
          color="bg-gradient-to-br from-emerald-500 to-emerald-600"
        />
        <MetricCard
          title="Total Orders"
          value={data.metrics.totalOrders}
          change={data.metrics.ordersChange}
          icon={ShoppingCart}
          color="bg-gradient-to-br from-amber-500 to-amber-600"
        />
        <MetricCard
          title="Avg Order Value"
          value={formatCurrency(data.metrics.averageOrderValue)}
          icon={TrendingUp}
          color="bg-gradient-to-br from-indigo-500 to-indigo-600"
        />
        <MetricCard
          title="Active Products"
          value={data.metrics.activeProducts}
          icon={Package}
          color="bg-gradient-to-br from-purple-500 to-purple-600"
        />
      </div>

      {/* Revenue Over Time */}
      <Card className="border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Revenue Trend</CardTitle>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Last 30 Days</p>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart data={data.revenueOverTime}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={COLORS.secondary} stopOpacity={0.3}/>
                  <stop offset="95%" stopColor={COLORS.secondary} stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#94a3b8"
                style={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <YAxis 
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                stroke="#94a3b8"
                style={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Tooltip 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={formatDate as any}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                  fontWeight: 'bold'
                }}
              />
              <Area 
                type="monotone" 
                dataKey="revenue" 
                stroke={COLORS.secondary} 
                strokeWidth={3}
                fillOpacity={1} 
                fill="url(#colorRevenue)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Revenue by Category & Order Status */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Revenue by Category */}
        <Card className="border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Revenue by Category</CardTitle>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Top Categories</p>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.revenueByCategory} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis 
                  type="number" 
                  tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                  stroke="#94a3b8"
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <YAxis 
                  type="category" 
                  dataKey="category" 
                  width={100}
                  stroke="#94a3b8"
                  style={{ fontSize: '12px', fontWeight: 'bold' }}
                />
                <Tooltip 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [formatCurrency(value), "Revenue"]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px 16px',
                    fontWeight: 'bold'
                  }}
                />
                <Bar dataKey="revenue" fill={COLORS.primary} radius={[0, 12, 12, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Order Status Distribution */}
        <Card className="border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
          <CardHeader className="p-8 pb-4">
            <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Order Status</CardTitle>
            <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Distribution</p>
          </CardHeader>
          <CardContent className="p-8 pt-0">
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={data.ordersByStatus}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  label={({ status, percent }: any) => `${status} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {data.ordersByStatus.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip 
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  formatter={(value: any) => [value, "Orders"]}
                  contentStyle={{
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    border: 'none',
                    borderRadius: '16px',
                    boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                    padding: '12px 16px',
                    fontWeight: 'bold'
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Top Products */}
      <Card className="border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Top Products</CardTitle>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">By Revenue</p>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.topProducts} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                type="number" 
                tickFormatter={(value) => `₹${(value / 1000).toFixed(0)}k`}
                stroke="#94a3b8"
                style={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <YAxis 
                type="category" 
                dataKey="name" 
                width={150}
                stroke="#94a3b8"
                style={{ fontSize: '11px', fontWeight: 'bold' }}
              />
              <Tooltip 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any, name: any) => {
                  if (name === 'revenue') return [formatCurrency(value), "Revenue"];
                  return [value, "Orders"];
                }}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                  fontWeight: 'bold'
                }}
              />
              <Legend 
                wrapperStyle={{ paddingTop: '20px', fontWeight: 'bold', fontSize: '12px' }}
              />
              <Bar dataKey="revenue" fill={COLORS.tertiary} radius={[0, 12, 12, 0]} name="Revenue" />
              <Bar dataKey="orders" fill={COLORS.primary} radius={[0, 12, 12, 0]} name="Orders" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Over Time */}
      <Card className="border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Order Volume</CardTitle>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Daily Orders</p>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data.ordersOverTime}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                stroke="#94a3b8"
                style={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <YAxis 
                stroke="#94a3b8"
                style={{ fontSize: '12px', fontWeight: 'bold' }}
              />
              <Tooltip 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                formatter={(value: any) => [value, "Orders"]}
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                labelFormatter={formatDate as any}
                contentStyle={{
                  backgroundColor: 'rgba(255, 255, 255, 0.95)',
                  border: 'none',
                  borderRadius: '16px',
                  boxShadow: '0 10px 40px rgba(0,0,0,0.1)',
                  padding: '12px 16px',
                  fontWeight: 'bold'
                }}
              />
              <Line 
                type="monotone" 
                dataKey="orders" 
                stroke={COLORS.primary} 
                strokeWidth={3}
                dot={{ fill: COLORS.primary, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Customer Insights */}
      <Card className="border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden">
        <CardHeader className="p-8 pb-4">
          <CardTitle className="text-2xl font-black tracking-tight text-slate-900">Customer Insights</CardTitle>
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">Last 30 Days</p>
        </CardHeader>
        <CardContent className="p-8 pt-0">
          <div className="grid gap-6 md:grid-cols-3">
            <div className="p-6 bg-gradient-to-br from-purple-50 to-purple-100 rounded-3xl border border-purple-200">
              <div className="flex items-center gap-3 mb-3">
                <Users className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-3xl font-black text-purple-900">{data.metrics.totalCustomers}</p>
                  <p className="text-xs font-black uppercase tracking-widest text-purple-600">Total Customers</p>
                </div>
              </div>
            </div>
            
            <div className="p-6 bg-gradient-to-br from-indigo-50 to-indigo-100 rounded-3xl border border-indigo-200">
              <div className="flex items-center gap-3 mb-3">
                <ShoppingCart className="h-8 w-8 text-indigo-600" />
                <div>
                  <p className="text-3xl font-black text-indigo-900">
                    {data.metrics.totalOrders > 0 ? (data.metrics.totalOrders / data.metrics.totalCustomers).toFixed(1) : '0'}
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Orders per Customer</p>
                </div>
              </div>
            </div>

            <div className="p-6 bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-3xl border border-emerald-200">
              <div className="flex items-center gap-3 mb-3">
                <DollarSign className="h-8 w-8 text-emerald-600" />
                <div>
                  <p className="text-2xl font-black text-emerald-900">
                    {formatCurrency(data.metrics.totalCustomers > 0 ? data.metrics.totalRevenue / data.metrics.totalCustomers : 0)}
                  </p>
                  <p className="text-xs font-black uppercase tracking-widest text-emerald-600">Revenue per Customer</p>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
