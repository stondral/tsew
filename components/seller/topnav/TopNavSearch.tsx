"use client";

import { useState, useMemo } from "react";
import { Search, Command, ArrowUpRight, Zap, Settings, ShoppingBag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { searchOrderAction } from "@/app/(frontend)/seller/actions/orders";

export function TopNavSearch() {
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const router = useRouter();

  const mockSearchResults = useMemo(() => {
    if (!searchQuery) return [];
    return [
      { id: 1, type: "Order", title: "ORD-9283-A", subtitle: "Customer: Jane Doe", icon: ShoppingBag },
      { id: 2, type: "Product", title: "Premium Cotton Tee", subtitle: "24 in stock", icon: Zap },
      { id: 3, type: "Setting", title: "Payment Gateways", subtitle: "Configure Razorpay", icon: Settings },
    ].filter(i => 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

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
    <div className="relative w-full group hidden lg:block max-w-2xl mx-auto">
      <div className={cn(
        "absolute inset-0 bg-amber-500/20 rounded-[1.5rem] blur-2xl transition-opacity duration-500",
        searchFocused ? "opacity-30" : "opacity-0"
      )} />
      <Search className={cn(
        "absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors z-10",
        searchFocused ? "text-amber-500" : "text-slate-400"
      )} />
      <Input 
        placeholder="Type command or search assets..." 
        value={searchQuery}
        onFocus={() => setSearchFocused(true)}
        onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
        onChange={(e) => setSearchQuery(e.target.value)}
        onKeyDown={handleSearch}
        className="pl-16 h-14 bg-white/60 dark:bg-slate-800/60 border-none ring-1 ring-slate-200 dark:ring-slate-700/50 focus-visible:ring-2 focus-visible:ring-amber-500/50 w-full rounded-[1.5rem] transition-all font-bold text-xs md:text-sm shadow-lg shadow-slate-200/20 dark:shadow-black/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400/60 z-10 backdrop-blur-xl"
      />
      <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-2 z-10">
        <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
          <Command className="h-3 w-3 text-slate-400 dark:text-slate-500" />
        </div>
        <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">K</span>
      </div>

      {searchFocused && (
        <div className="absolute top-16 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white dark:border-slate-800 rounded-[2rem] shadow-2xl p-3 z-[100] animate-in slide-in-from-top-4 duration-300">
          <div className="p-3">
            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Quick Results</p>
            {searchQuery ? (
              <div className="space-y-1">
                {mockSearchResults.length > 0 ? mockSearchResults.map(item => (
                  <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer group/item transition-colors">
                    <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                      <item.icon className="h-5 w-5 text-amber-500" />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-black text-slate-900 dark:text-white">{item.title}</p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">{item.subtitle}</p>
                    </div>
                    <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover/item:text-amber-500 transition-colors opacity-0 group-hover/item:opacity-100" />
                  </div>
                )) : (
                  <div className="p-8 text-center">
                    <p className="text-xs font-bold text-slate-400">No objects found</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2">
                <Link href="/seller/products/add" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-amber-500 group transition-colors text-center">
                  <p className="text-[10px] font-black text-slate-400 group-hover:text-white/60 uppercase">Action</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-white mt-1">Add Product</p>
                </Link>
                <Link href="/seller/orders" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-blue-500 group transition-colors text-center">
                  <p className="text-[10px] font-black text-slate-400 group-hover:text-white/60 uppercase">Stats</p>
                  <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-white mt-1">Orders</p>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
