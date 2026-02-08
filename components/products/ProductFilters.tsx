"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { ChevronRight, Filter, X } from "lucide-react";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Props {
  categories: Category[];
  currentCategory?: string;
  currentMinPrice?: string;
  currentMaxPrice?: string;
}

export default function ProductFilters({ 
  categories, 
  currentCategory, 
  currentMinPrice, 
  currentMaxPrice 
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [minPrice, setMinPrice] = useState(currentMinPrice || "");
  const [maxPrice, setMaxPrice] = useState(currentMaxPrice || "");

  // Update local state when props change
  useEffect(() => {
    setMinPrice(currentMinPrice || "");
    setMaxPrice(currentMaxPrice || "");
  }, [currentMinPrice, currentMaxPrice]);

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams?.toString() || "");
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const handleCategoryClick = (categoryId: string) => {
    const value = currentCategory === categoryId ? "" : categoryId;
    router.push(`/products?${createQueryString("category", value)}`);
  };

  const handlePriceApply = () => {
    const params = new URLSearchParams(searchParams?.toString() || "");
    if (minPrice) params.set("minPrice", minPrice);
    else params.delete("minPrice");
    
    if (maxPrice) params.set("maxPrice", maxPrice);
    else params.delete("maxPrice");

    router.push(`/products?${params.toString()}`);
  };

  const clearPrices = () => {
    setMinPrice("");
    setMaxPrice("");
    const params = new URLSearchParams(searchParams?.toString() || "");
    params.delete("minPrice");
    params.delete("maxPrice");
    router.push(`/products?${params.toString()}`);
  };

  return (
    <div className="space-y-6 md:space-y-8 bg-white p-4 sm:p-8 rounded-[2rem] md:rounded-[2.5rem] border border-gray-100 shadow-xl shadow-gray-200/40">
      <div className="flex items-center gap-3 mb-2">
        <div className="bg-orange-600 p-2 rounded-xl">
          <Filter className="w-5 h-5 text-white" />
        </div>
        <h3 className="text-xl font-black text-gray-900">Filters</h3>
      </div>

      {/* Categories */}
      <div className="space-y-4">
        <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest px-1">Collections</h4>
        <div className="space-y-2">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => handleCategoryClick(cat.id)}
              className={`w-full flex items-center justify-between px-4 py-3 rounded-2xl transition-all duration-300 group ${
                currentCategory === cat.id
                  ? "bg-orange-600 text-white shadow-lg shadow-orange-200 translate-x-1"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100"
              }`}
            >
              <span className="font-bold">{cat.name}</span>
              <ChevronRight className={`w-4 h-4 transition-transform ${
                currentCategory === cat.id ? "rotate-90" : "group-hover:translate-x-1"
              }`} />
            </button>
          ))}
        </div>
      </div>

      <div className="h-px bg-gray-100" />

      {/* Price Range */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h4 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Price Range</h4>
          {(currentMinPrice || currentMaxPrice) && (
             <button onClick={clearPrices} className="text-xs font-bold text-orange-600 hover:underline">Reset</button>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          <div className="relative group flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
            <input
              type="number"
              placeholder="Min"
              value={minPrice}
              onChange={(e) => setMinPrice(e.target.value)}
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-200 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
            />
          </div>
          <div className="w-2 h-0.5 bg-gray-200 rounded-full" />
          <div className="relative group flex-1">
            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold">₹</span>
            <input
              type="number"
              placeholder="Max"
              value={maxPrice}
              onChange={(e) => setMaxPrice(e.target.value)}
              className="w-full pl-8 pr-4 py-3 bg-gray-50 border-2 border-transparent focus:border-orange-200 focus:bg-white rounded-2xl outline-none transition-all font-bold text-gray-700 placeholder:text-gray-300"
            />
          </div>
        </div>
        
        <button
          onClick={handlePriceApply}
          className="w-full py-4 bg-gray-900 hover:bg-black text-white font-black rounded-2xl transition-all shadow-lg hover:scale-[1.02] active:scale-[0.98]"
        >
          Apply Range
        </button>
      </div>

      {/* Clear All */}
      {(currentCategory || currentMinPrice || currentMaxPrice) && (
        <button
          onClick={() => router.push("/products")}
          className="w-full flex items-center justify-center gap-2 py-3 bg-red-50 hover:bg-red-100 text-red-600 font-bold rounded-2xl transition-all"
        >
          <X className="w-4 h-4" />
          Clear All
        </button>
      )}
    </div>
  );
}
