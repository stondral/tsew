"use client";

import { Card, CardContent } from "@/components/ui/card";
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  DollarSign, 
  Package, 
  PieChart, 
  ShoppingCart,
  ShoppingBag,
  Activity,
  Plus,
  LayoutGrid
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const IconMap: Record<string, any> = {
  "shopping-bag": ShoppingBag,
  "activity": Activity,
  "layout-grid": LayoutGrid,
  "plus": Plus,
  "users": Users,
  "dollar-sign": DollarSign,
  "package": Package,
  "pie-chart": PieChart,
  "shopping-cart": ShoppingCart,
};

interface StatItem {
  title: string;
  value: string;
  change: string;
  isPositive: boolean;
  icon: string; // Changed from any to string
  color: string;
}

interface StatsCardsProps {
  stats: StatItem[];
}

function StatCard({ title, value, change, isPositive, icon, color }: StatItem) {
  const Icon = IconMap[icon] || Activity;
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.01 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
    >
      <Card className="overflow-hidden border border-white/20 shadow-2xl shadow-slate-200/50 bg-white/40 backdrop-blur-md group relative h-full rounded-[2rem]">
        <div className={`absolute top-0 right-0 p-6 opacity-5 transition-transform duration-500 group-hover:scale-110 group-hover:rotate-12`}>
           <Icon className="h-24 w-24 -mr-8 -mt-8" />
        </div>
        <CardContent className="p-8">
          <div className="flex items-center justify-between mb-6">
            <div className={cn(
                "p-4 rounded-2xl shadow-inner ring-1 ring-black/5",
                color === "amber" ? "bg-amber-500/10 text-amber-600 ring-amber-500/20" : 
                color === "indigo" ? "bg-indigo-500/10 text-indigo-600 ring-indigo-500/20" :
                color === "emerald" ? "bg-emerald-500/10 text-emerald-600 ring-emerald-500/20" :
                "bg-slate-500/10 text-slate-600 ring-slate-500/20"
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div className={cn(
                "flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-black shadow-sm uppercase tracking-wider",
                isPositive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
            )}>
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {change}
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-black text-slate-400 uppercase tracking-[0.15em] mb-2">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 tracking-tight leading-none tabular-nums">{value}</h3>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

export function StatsCards({ stats }: StatsCardsProps) {
  const items = stats || [
    { title: "Total Revenue", value: "₹0", change: "0%", isPositive: true, icon: "dollar-sign", color: "amber" },
    { title: "Active Orders", value: "0", change: "0%", isPositive: true, icon: "shopping-cart", color: "indigo" },
    { title: "Active Products", value: "0", change: "0%", isPositive: true, icon: "package", color: "emerald" },
    { title: "Total Customers", value: "0", change: "0%", isPositive: true, icon: "users", color: "slate" },
  ];

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
      {items.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
