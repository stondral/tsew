"use client";

import { useQuery } from "@tanstack/react-query";
import type { RedisProduct } from "@/lib/redis/types";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export interface SellerProfile extends Record<string, any> {
    id: string;
    name?: string;
    username?: string;
    isVerified?: boolean;
}

/**
 * Fetch seller details from API
 */
async function fetchSeller(id: string): Promise<SellerProfile> {
    const response = await fetch(`/api/seller?id=${id}`);
    if (!response.ok) {
        throw new Error("Failed to fetch seller details");
    }
    const data = await response.json();
    return data.seller;
}

/**
 * Fetch seller products from API
 */
async function fetchSellerProducts(sellerId: string, limit = 50): Promise<RedisProduct[]> {
    const response = await fetch(`/api/products?type=seller&sellerId=${sellerId}&limit=${limit}`);
    if (!response.ok) {
        throw new Error("Failed to fetch seller products");
    }
    const data = await response.json();
    return data.products || [];
}

/**
 * Main useSeller hook for storefronts
 * Features 1 hour cache for seller details and 15 minute cache for their top products
 */
export function useSeller(sellerId: string) {
    const {
        data: seller,
        isLoading: isSellerLoading,
        error: sellerError,
        refetch: refetchSeller,
    } = useQuery({
        queryKey: ["seller", sellerId],
        queryFn: () => fetchSeller(sellerId),
        staleTime: 60 * 60 * 1000, // 1 hour cache
        gcTime: 2 * 60 * 60 * 1000, // 2 hours GC
        refetchOnWindowFocus: false,
        enabled: !!sellerId,
    });

    const {
        data: products,
        isLoading: isProductsLoading,
        error: productsError,
        refetch: refetchProducts,
    } = useQuery({
        queryKey: ["products", "seller", sellerId],
        queryFn: () => fetchSellerProducts(sellerId, 50),
        staleTime: 15 * 60 * 1000, // 15 mins cache
        gcTime: 30 * 60 * 1000, // 30 mins GC
        refetchOnWindowFocus: false,
        enabled: !!sellerId,
    });

    return {
        seller,
        products: products || [],
        isLoading: isSellerLoading || isProductsLoading,
        isSellerLoading,
        isProductsLoading,
        error: sellerError || productsError,
        refetch: () => {
            refetchSeller();
            refetchProducts();
        },
    };
}
