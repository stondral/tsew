"use client";

import { useState } from "react";
import { Menu, Search, Sparkles, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Input } from "@/components/ui/input";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Sidebar } from "../Sidebar";
import { searchOrderAction } from "@/app/(frontend)/seller/actions/orders";

interface TopNavMobileProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

export function TopNavMobile({ user }: TopNavMobileProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const handleSearch = async (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && searchQuery.trim()) {
      const query = searchQuery.trim();
      if (query.startsWith("ORD-")) {
        try {
          const res = await searchOrderAction(query);
          if (res.ok && res.id) {
            router.push(`/seller/orders/${res.id}`);
            setSearchQuery("");
          } else {
            router.push(`/seller/orders/not-found?q=${query}`);
          }
        } catch (err) {
          console.error("Search failed:", err);
        }
      }
    }
  };

  return (
    <div className="flex items-center gap-4 shrink-0">
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="lg:hidden shrink-0 dark:text-slate-400 dark:hover:text-amber-500 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl shadow-sm border border-white dark:border-slate-700">
            <Menu className="h-5 w-5 md:h-6 md:w-6" />
          </Button>
        </SheetTrigger>
        <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px] border-r-0">
          <Sidebar user={user} className="w-full h-full" />
        </SheetContent>
      </Sheet>
      
      <div className="hidden lg:flex items-center gap-2 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
        <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
        <span>Navigating Node</span>
      </div>

      {/* Mobile Search Trigger */}
      <Sheet>
        <SheetTrigger asChild>
          <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 text-slate-500 lg:hidden rounded-xl">
            <Search className="h-5 w-5" />
          </Button>
        </SheetTrigger>
        <SheetContent side="top" className="h-full sm:h-auto border-b-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6">
          <div className="flex flex-col gap-6 pt-8">
            <div className="flex flex-col gap-1">
              <h2 className="text-2xl font-black italic">Command Search</h2>
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Node Interface</p>
            </div>
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
              <Input 
                autoFocus
                placeholder="Type to search..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={handleSearch}
                className="pl-14 h-16 bg-slate-50 dark:bg-slate-800/50 border-none ring-2 ring-slate-100 dark:ring-slate-700/50 focus-visible:ring-amber-500 rounded-2xl text-lg font-bold"
              />
            </div>
            <div className="space-y-4">
              <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Actions</p>
              <div className="grid grid-cols-1 gap-2">
                <Link href="/seller/products/add" className="p-5 bg-amber-500 text-white rounded-2xl flex items-center justify-between group">
                  <span className="font-black uppercase tracking-widest">Add New Product</span>
                  <Sparkles className="h-5 w-5" />
                </Link>
                <Link href="/seller/orders" className="p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                  <span className="font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">View All Orders</span>
                  <ShoppingBag className="h-5 w-5 text-slate-400" />
                </Link>
              </div>
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </div>
  );
}
