"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { ArrowDownAZ, LayoutGrid, List } from "lucide-react";

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
      const params = new URLSearchParams(searchParams.toString());
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
            (!searchParams.get("view") || searchParams.get("view") === "grid") 
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
            searchParams.get("view") === "list" 
              ? "bg-orange-50 text-orange-600 shadow-sm" 
              : "text-gray-400 hover:text-gray-600 hover:bg-gray-50"
          }`}
          title="List View"
        >
          <List className="w-5 h-5" />
        </button>
      </div>

      <div className="relative group">
        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-orange-600">
          <ArrowDownAZ className="w-5 h-5" />
        </div>
        <select
          value={currentSort}
          onChange={(e) => router.push(`/products?${createQueryString("sort", e.target.value)}`)}
          className="appearance-none pl-12 pr-10 py-4 bg-white border border-gray-100 rounded-2xl outline-none focus:ring-2 focus:ring-orange-100 transition-all font-bold text-gray-900 shadow-sm hover:shadow-md cursor-pointer"
        >
          {SORT_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
           <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
           </svg>
        </div>
      </div>
    </div>
  );
}
