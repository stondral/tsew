"use client";

import React from 'react';
import ProductSkeleton from './ProductSkeleton';

interface ProductsGridSkeletonProps {
  count?: number;
  view?: "grid" | "list";
}

export const ProductsGridSkeleton = ({ count = 8, view = "grid" }: ProductsGridSkeletonProps) => {
  const gridClasses = view === "list" 
    ? "flex flex-col gap-6" 
    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  return (
    <div className={gridClasses}>
      {Array.from({ length: count }).map((_, i) => (
        <ProductSkeleton key={i} view={view} />
      ))}
    </div>
  );
};
