"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ArrowDownAZ, LayoutGrid, List } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Props {
  currentSort: string;
}

const SORT_OPTIONS = [
  { label: "Newest Arrivals", value: "newest" },
  { label: "Price: Low to High", value: "price-asc" },
  { label: "Price: High to Low", value: "price-desc" },
];

export default function ProductSort({ currentSort }: Props) {
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
    <div className="flex items-center gap-4">
      <div className="hidden sm:flex items-center bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
        <button 
          onClick={() => router.push(`/products?${createQueryString("view", "grid")}`)}
          className={`p-2.5 rounded-xl transition-all ${
            (!searchParams?.get("view") || searchParams?.get("view") === "grid") 
              ? "bg-orange-50 text-orange-600 shadow-sm" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
          title="Grid View"
        >
          <LayoutGrid className="w-5 h-5" />
        </button>
        <button 
          onClick={() => router.push(`/products?${createQueryString("view", "list")}`)}
          className={`p-2.5 rounded-xl transition-all ${
            searchParams?.get("view") === "list" 
              ? "bg-orange-50 text-orange-600 shadow-sm" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
          title="List View"
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      <div className="relative group min-w-[200px]">
        <Select
          value={currentSort}
          onValueChange={(value) =>
            router.push(`/products?${createQueryString("sort", value)}`)
          }
        >
          <SelectTrigger className="h-auto pl-12 pr-10 py-4 bg-white border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-100 transition-all font-bold text-gray-900 shadow-sm hover:shadow-md cursor-pointer border">
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
    </div>
  );
}
