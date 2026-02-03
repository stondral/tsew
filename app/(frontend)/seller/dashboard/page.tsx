"use client";

import { StatsCards } from "@/components/seller/StatsCards";
import { RevenueChart } from "@/components/seller/RevenueChart";
import { RecentOrdersTable } from "@/components/seller/RecentOrdersTable";
import { BestSellingProducts } from "@/components/seller/BestSellingProducts";
import { Button } from "@/components/ui/button";
import { FileDown, Plus, Sparkles } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";

interface StatItem {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string;
  color: string;
}

interface DashboardData {
  stats: StatItem[];
  chartData: unknown[];
  orders: unknown[];
  topProducts: unknown[];
  user: { username?: string; email?: string };
}

// Client-side component for handling dynamic data fetching or UI state
export default function SellerDashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardData() {
        try {
            const res = await fetch('/api/seller/dashboard');
            if (res.ok) {
                const result = await res.json();
                setData(result);
            }
        } catch (error) {
            console.error("Failed to fetch dashboard data:", error);
        } finally {
            setLoading(false);
        }
    }
    fetchDashboardData();
  }, []);

  if (loading) {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
            <div className="h-12 w-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em] animate-pulse">Syncing your workspace...</p>
        </div>
    );
  }

  const { stats, chartData, orders, topProducts, user } = data || {
    stats: [],
    chartData: [],
    orders: [],
    topProducts: [],
    user: { username: "Seller" }
  };

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
          <RecentOrdersTable orders={orders.slice(0, 15)} />
      </div>
    </div>
  );
}
