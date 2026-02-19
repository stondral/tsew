import React from 'react';

const ProductSkeleton = () => (
  <div className="animate-pulse bg-gray-100 rounded-lg overflow-hidden h-[400px]">
    <div className="bg-gray-200 h-64 w-full" />
    <div className="p-4 space-y-3">
      <div className="h-4 bg-gray-200 rounded w-3/4" />
      <div className="h-4 bg-gray-200 rounded w-1/2" />
      <div className="h-6 bg-gray-200 rounded w-1/4 mt-4" />
    </div>
  </div>
);

export const ProductsGridSkeleton = ({ count = 4 }: { count?: number }) => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
    {Array.from({ length: count }).map((_, i) => (
      <ProductSkeleton key={i} />
    ))}
  </div>
);
