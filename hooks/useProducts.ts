'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { RedisProduct } from '@/lib/redis/types';

/**
 * useProducts Hook
 * 
 * TanStack Query hook for product list management with caching.
 * Provides fast product browsing with automatic background refetching.
 */

interface ProductFilters {
  category?: string;
  page?: number;
  limit?: number;
  search?: string;
  minPrice?: number;
  maxPrice?: number;
}

interface ProductListResponse {
  docs: RedisProduct[];
  totalPages: number;
  totalDocs: number;
  page: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
}

/**
 * Fetch products from API
 */
async function fetchProducts(filters: ProductFilters = {}): Promise<ProductListResponse> {
  const params = new URLSearchParams();
  
  if (filters.category) params.append('category', filters.category);
  if (filters.page) params.append('page', String(filters.page));
  if (filters.limit) params.append('limit', String(filters.limit));
  if (filters.search) params.append('search', filters.search);
  if (filters.minPrice) params.append('minPrice', String(filters.minPrice));
  if (filters.maxPrice) params.append('maxPrice', String(filters.maxPrice));

  const response = await fetch(`/api/products?${params.toString()}`);

  if (!response.ok) {
    throw new Error('Failed to fetch products');
  }

  return response.json();
}

/**
 * Main useProducts hook
 */
export function useProducts(filters: ProductFilters = {}) {
  const queryKey = ['products', filters];

  const {
    data,
    isLoading,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey,
    queryFn: () => fetchProducts(filters),
    staleTime: 15 * 60 * 1000, // 15 minutes (matches Redis product list TTL)
    gcTime: 30 * 60 * 1000, // 30 minutes
    refetchOnWindowFocus: false,
  });

  return {
    products: data?.docs || [],
    totalPages: data?.totalPages || 0,
    totalDocs: data?.totalDocs || 0,
    currentPage: data?.page || 1,
    hasNextPage: data?.hasNextPage || false,
    hasPrevPage: data?.hasPrevPage || false,
    isLoading,
    isFetching,
    error,
    refetch,
  };
}

/**
 * useProductDetail Hook
 * 
 * TanStack Query hook for single product with prefetching support.
 */

/**
 * Fetch single product from API
 */
async function fetchProduct(slug: string): Promise<RedisProduct> {
  const response = await fetch(`/api/products/${slug}`);

  if (!response.ok) {
    throw new Error('Failed to fetch product');
  }

  return response.json();
}

/**
 * Main useProductDetail hook
 */
export function useProductDetail(slug: string) {
  const queryClient = useQueryClient();

  const {
    data: product,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey: ['product', slug],
    queryFn: () => fetchProduct(slug),
    staleTime: 60 * 60 * 1000, // 1 hour (matches Redis product TTL)
    gcTime: 2 * 60 * 60 * 1000, // 2 hours
    refetchOnWindowFocus: false,
    enabled: !!slug, // Only fetch if slug is provided
  });

  // Prefetch function for hover interactions
  const prefetch = (prefetchSlug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', prefetchSlug],
      queryFn: () => fetchProduct(prefetchSlug),
      staleTime: 60 * 60 * 1000,
    });
  };

  return {
    product,
    isLoading,
    error,
    refetch,
    prefetch,
  };
}

/**
 * usePrefetchProduct Hook
 * 
 * Lightweight hook for prefetching products on hover.
 * Use this in product cards for instant navigation.
 */
export function usePrefetchProduct() {
  const queryClient = useQueryClient();

  const prefetch = (slug: string) => {
    queryClient.prefetchQuery({
      queryKey: ['product', slug],
      queryFn: () => fetchProduct(slug),
      staleTime: 60 * 60 * 1000,
    });
  };

  return { prefetch };
}

/**
 * useInvalidateProduct Hook
 * 
 * Hook for manually invalidating product cache.
 * Useful for admin actions or after updates.
 */
export function useInvalidateProduct() {
  const queryClient = useQueryClient();

  const invalidateProduct = (slug: string) => {
    queryClient.invalidateQueries({ queryKey: ['product', slug] });
  };

  const invalidateAllProducts = () => {
    queryClient.invalidateQueries({ queryKey: ['products'] });
    queryClient.invalidateQueries({ queryKey: ['product'] });
  };

  return {
    invalidateProduct,
    invalidateAllProducts,
  };
}
