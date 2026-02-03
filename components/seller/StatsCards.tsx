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
  icon: string;
  color: string;
}

interface StatsCardsProps {
  stats: StatItem[];
}

function StatCard({ title, value, change, isPositive, icon, color }: StatItem) {
  const Icon = IconMap[icon] || Activity;
  
  return (
    <motion.div
      whileHover={{ y: -5, scale: 1.02 }}
      transition={{ duration: 0.3, ease: "easeOut" }}
      className="h-full"
    >
      <Card className="overflow-hidden border border-white/20 dark:border-slate-800 shadow-xl dark:shadow-black/20 bg-white/40 dark:bg-slate-900/40 backdrop-blur-md group relative h-full rounded-[2.5rem] transition-colors duration-300">
        <div className={cn(
          "absolute top-0 right-0 p-8 opacity-[0.03] dark:opacity-[0.05] transition-transform duration-700 group-hover:scale-125 group-hover:rotate-12 group-hover:opacity-[0.08]",
          color === "amber" ? "text-amber-500" : 
          color === "indigo" ? "text-indigo-500" :
          color === "emerald" ? "text-emerald-500" :
          "text-slate-500"
        )}>
           <Icon className="h-32 w-32 -mr-10 -mt-10" />
        </div>
        <CardContent className="p-8 relative z-10">
          <div className="flex items-center justify-between mb-8">
            <div className={cn(
                "p-4 rounded-[1.25rem] shadow-lg transition-transform group-hover:scale-110 duration-500",
                color === "amber" ? "bg-amber-500/10 text-amber-600 dark:text-amber-500 ring-1 ring-amber-500/20" : 
                color === "indigo" ? "bg-indigo-500/10 text-indigo-600 dark:text-indigo-500 ring-1 ring-indigo-500/20" :
                color === "emerald" ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-500 ring-1 ring-emerald-500/20" :
                "bg-slate-500/10 text-slate-600 dark:text-slate-400 ring-1 ring-slate-500/20"
            )}>
              <Icon className="h-6 w-6" />
            </div>
            <div className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black shadow-sm uppercase tracking-wider transition-colors",
                isPositive 
                  ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-500' 
                  : 'bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-500'
            )}>
              {isPositive ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {change}
            </div>
          </div>
          <div className="space-y-2">
            <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-[0.2em]">{title}</p>
            <h3 className="text-3xl font-black text-slate-900 dark:text-slate-100 tracking-tight leading-none tabular-nums group-hover:text-amber-500 transition-colors duration-300">{value}</h3>
          </div>
          
          <div className="mt-8 h-1 w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
             <motion.div 
               initial={{ width: 0 }}
               animate={{ width: "70%" }}
               transition={{ duration: 1.5, delay: 0.5 }}
               className={cn(
                 "h-full rounded-full",
                 color === "amber" ? "bg-amber-500" : 
                 color === "indigo" ? "bg-indigo-500" :
                 color === "emerald" ? "bg-emerald-500" :
                 "bg-slate-500"
               )}
             />
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
    <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4 px-1">
      {items.map((stat, index) => (
        <StatCard key={index} {...stat} />
      ))}
    </div>
  );
}
