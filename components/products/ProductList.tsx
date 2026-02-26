'use client';

import { useQuery } from '@tanstack/react-query';
import ProductsGrid from "./ProductsGrid";
import Link from "next/link";
import { getFilteredProducts } from './actions';
import { ProductsGridSkeleton } from './ProductsGridSkeleton';

interface Props {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  view?: "grid" | "list";
}

export default function ProductList({ q, category, minPrice, maxPrice, sort, view }: Props) {
  const { data: products, isLoading, error } = useQuery({
    queryKey: ['products', { q, category, minPrice, maxPrice, sort }],
    queryFn: () => getFilteredProducts({ q, category, minPrice, maxPrice, sort })
  });

  if (isLoading) {
    return (
      <div className={view === "list" ? "flex flex-col gap-6" : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"}>
        <ProductsGridSkeleton count={8} />
      </div>
    );
  }

  if (error || !products) {
    return <div className="text-center py-10 text-red-500">Failed to load products.</div>;
  }

  if (products.length === 0) {
    return (
      <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 shadow-xl shadow-gray-200/50">
        <div className="bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-lg">
          <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <h2 className="text-3xl font-extrabold text-gray-900 mb-3">No matches found</h2>
        <p className="text-gray-500 max-w-sm mx-auto mb-10 text-lg leading-relaxed">
          The masterpiece you&apos;re looking for might be in another gallery. Try refining your filters.
        </p>
        <Link 
          href="/products" 
          className="inline-flex items-center justify-center px-10 py-5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-[0.98]"
        >
          Clear All Filters
        </Link>
      </div>
    );
  }

  return <ProductsGrid products={products} view={view} />;
}
