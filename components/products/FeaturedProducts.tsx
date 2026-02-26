'use client';

import React from 'react';
import ProductsGrid from './ProductsGrid';
import { useQuery } from '@tanstack/react-query';
import { ProductsGridSkeleton } from './ProductsGridSkeleton';

export default function FeaturedProducts() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['featuredProducts'],
    queryFn: async () => {
      const res = await fetch('/api/products?type=featured&limit=8');
      if (!res.ok) throw new Error('Failed to fetch featured products');
      return res.json();
    }
  });

  if (isLoading) return <ProductsGridSkeleton count={4} />;
  
  if (error) {
    console.error('Error fetching featured products:', error);
    return <p className="text-center text-gray-500 py-8">Unable to load featured products.</p>;
  }

  return <ProductsGrid products={data?.products || []} />;
}
