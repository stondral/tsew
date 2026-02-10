"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ArrowDownAZ, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import ProductFilters from "./ProductFilters";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  currentSort: string;
  categories: Category[];
  currentCategory?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
}

const SORT_OPTIONS = [
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
];

export default function ProductSort({ 
  currentSort, 
  categories, 
  currentCategory, 
  currentMinPrice, 
  currentMaxPrice 
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      params.set(name, value);
      return params.toString();
    },
    [searchParams]
  );

  return (
    <div className="flex items-center gap-3">
      <div className="relative group min-w-[170px] sm:min-w-[200px] flex-1 sm:flex-none">
        <Select
          value={currentSort}
          onValueChange={(value) =>
            router.push(`/products?${createQueryString("sort", value)}`)
          }
        >
          <SelectTrigger className="h-auto pl-12 pr-10 py-4 bg-white border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-100 transition-all font-bold text-gray-900 shadow-sm hover:shadow-md cursor-pointer border w-full">
            <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600">
              <ArrowDownAZ className="w-5 h-5" />
            </div>
            <SelectValue placeholder="Sort by" />
          </SelectTrigger>
          <SelectContent className="rounded-2xl border-gray-100 shadow-xl">
            {SORT_OPTIONS.map((opt) => (
              <SelectItem 
                key={opt.value} 
                value={opt.value}
                className="py-3 px-4 focus:bg-orange-50 focus:text-orange-600 rounded-xl transition-colors cursor-pointer"
              >
                {opt.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Mobile Filters Button - Visible on mobile/tablet, hidden on desktop */}
      <div className="lg:hidden">
        <Sheet>
          <SheetTrigger asChild>
            <Button 
              variant="outline" 
              className="h-auto px-5 py-4 bg-white border-gray-100 rounded-2xl font-black text-gray-900 shadow-sm hover:shadow-md cursor-pointer border flex items-center gap-2 group active:scale-95 transition-all text-sm uppercase tracking-widest"
            >
              <div className="bg-orange-600 p-1.5 rounded-lg group-hover:scale-110 transition-transform">
                <Filter className="w-4 h-4 text-white" />
              </div>
              <span className="hidden xs:inline">Filters</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full sm:max-w-md p-0 bg-white/95 backdrop-blur-2xl border-l-0 overflow-hidden flex flex-col">
            <div className="absolute top-0 left-0 w-full h-full opacity-[0.02] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")` }} />
            
            <SheetHeader className="p-8 bg-white/50 backdrop-blur-md border-b border-gray-100 relative z-10">
              <div className="flex items-center gap-3 mb-2">
                <div className="h-2 w-10 bg-orange-500 rounded-full" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-orange-600">Preferences</span>
              </div>
              <SheetTitle className="text-4xl font-black text-slate-900 tracking-tight leading-none">
                Refine <span className="text-orange-500 italic font-medium">Gallery</span>
              </SheetTitle>
              <SheetDescription className="font-bold text-slate-500 mt-3 text-sm leading-relaxed max-w-[240px]">
                Fine-tune your selection with precision filters.
              </SheetDescription>
            </SheetHeader>
            
            <div className="flex-1 overflow-y-auto p-8 relative z-10 scrollbar-hide">
              <div className="bg-white/40 rounded-3xl p-6 border border-white/60 shadow-inner">
                <ProductFilters 
                  categories={categories}
                  currentCategory={currentCategory}
                  currentMinPrice={currentMinPrice}
                  currentMaxPrice={currentMaxPrice}
                />
              </div>
            </div>

            <div className="p-6 bg-white border-t border-gray-100 relative z-10">
              <Button 
                onClick={() => {
                  const closeButton = document.querySelector('button[aria-label="Close"]') as HTMLButtonElement;
                  if (closeButton) closeButton.click();
                }}
                className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black uppercase text-xs tracking-widest rounded-2xl shadow-xl shadow-slate-200 border-none transition-all active:scale-[0.98]"
              >
                Apply & Browse
              </Button>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </div>
  );
}
