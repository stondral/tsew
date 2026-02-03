"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Package, ExternalLink } from "lucide-react";
import Image from "next/image";
import { resolveMediaUrl } from "@/lib/media";
import Link from "next/link";

interface BestSellingProductsProps {
  products: unknown[];
}

export function BestSellingProducts({ products }: BestSellingProductsProps) {
  const displayProducts = products || [];

  return (
    <Card className="border border-slate-100 dark:border-slate-800 shadow-xl dark:shadow-black/20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md rounded-[2.5rem] overflow-hidden sticky top-24 transition-colors duration-300">
      <CardHeader className="p-8 pb-4 flex flex-row items-center justify-between border-b border-slate-50 dark:border-slate-800">
        <div>
          <CardTitle className="text-xl font-black tracking-tight text-slate-900 dark:text-slate-100">Top Performers</CardTitle>
          <p className="text-[10px] font-black text-slate-400 dark:text-slate-500 mt-1 uppercase tracking-[0.2em]">Most Sold This Month</p>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="divide-y divide-slate-50 dark:divide-slate-800">
          {displayProducts.length === 0 ? (
             <div className="p-12 text-center">
                <Package className="h-12 w-12 text-slate-200 dark:text-slate-700 mx-auto mb-4" />
                <p className="text-slate-400 dark:text-slate-600 font-bold uppercase tracking-widest text-xs">No products found</p>
             </div>
          ) : (
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            (displayProducts as any[]).map((product: any) => (
              <div key={product.id} className="p-6 hover:bg-slate-50/50 dark:hover:bg-slate-800/30 transition-all group flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-2xl overflow-hidden shadow-md border border-white dark:border-slate-800 group-hover:scale-105 transition-transform duration-300 relative bg-slate-100 dark:bg-slate-800">
                    {product.media && product.media.length > 0 ? (
                        <Image 
                            src={resolveMediaUrl(product.media[0])} 
                            alt={product.name} 
                            fill 
                            className="object-cover" 
                        />
                    ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-300 dark:text-slate-600">
                            <Package className="h-6 w-6" />
                        </div>
                    )}
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100 group-hover:text-amber-600 transition-colors truncate max-w-[140px]">{product.name}</span>
                    <div className="flex items-center gap-1.5 text-[10px] font-black text-emerald-500 uppercase tracking-tight mt-1">
                      <TrendingUp className="h-2.5 w-2.5" />
                      Trending Up
                    </div>
                  </div>
                </div>
                <div className="flex flex-col items-end">
                    <span className="text-sm font-black text-slate-900 dark:text-slate-100">₹{product.basePrice}</span>
                    <span className="text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-tighter mt-1">{product.salesCount || 0} Sales</span>
                </div>
              </div>
            ))
          )}
        </div>
        <div className="p-6 bg-slate-50/30 dark:bg-slate-800/20 border-t border-slate-50 dark:border-slate-800">
            <Link href="/seller/products">
                <Button variant="ghost" className="w-full font-black text-xs text-slate-500 dark:text-slate-400 hover:text-amber-600 dark:hover:text-amber-500 hover:bg-amber-50 dark:hover:bg-amber-500/10 rounded-xl uppercase tracking-widest transition-all gap-2">
                    View Full Inventory <ExternalLink className="h-3 w-3" />
                </Button>
            </Link>
        </div>
      </CardContent>
    </Card>
  );
}
