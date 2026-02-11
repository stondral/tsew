'use client'

import { useQuery } from '@tanstack/react-query';

/**
 * useShippingRates Hook
 * 
 * TanStack Query hook for shipping cost calculation with Redis caching.
 * Provides fast shipping estimates with 6-hour cache TTL.
 */

interface ShippingParams {
  originPincode: string;
  destinationPincode: string;
  weight: number; // in grams
  dimensions?: {
    length: number;
    width: number;
    height: number;
  };
  mode?: 'S' | 'E'; // Surface or Express
}

interface ShippingRates {
  cost: number;
  estimatedDays: number;
  serviceName: string;
}

/**
 * Fetch shipping rates from API
 */
async function fetchShippingRates(params: ShippingParams): Promise<ShippingRates> {
  const response = await fetch('/api/shipping/calculate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(params),
  });

  if (!response.ok) {
    throw new Error('Failed to fetch shipping rates');
  }

  return response.json();
}

/**
 * Main useShippingRates hook
 */
export function useShippingRates(params: ShippingParams, enabled = true) {
  const queryKey = ['shipping', params];

  const {
    data,
    isLoading,
    error,
    refetch,
  } = useQuery({
    queryKey,
    queryFn: () => fetchShippingRates(params),
    staleTime: 6 * 60 * 60 * 1000, // 6 hours (matches Redis shipping TTL)
    gcTime: 12 * 60 * 60 * 1000, // 12 hours
    refetchOnWindowFocus: false,
    enabled: enabled && !!params.originPincode && !!params.destinationPincode && params.weight > 0,
  });

  return {
    shippingCost: data?.cost || 0,
    estimatedDays: data?.estimatedDays || 0,
    serviceName: data?.serviceName || '',
    isLoading,
    error,
    refetch,
  };
}

/**
 * useShippingEstimate Hook
 * 
 * Simplified hook for quick shipping estimates.
 * Returns null if params are invalid.
 */
export function useShippingEstimate(
  originPincode: string,
  destinationPincode: string,
  weight: number
) {
  const { shippingCost, estimatedDays, isLoading } = useShippingRates({
    originPincode,
    destinationPincode,
    weight,
    mode: 'S', // Default to Surface
  });

  if (isLoading || !originPincode || !destinationPincode || weight <= 0) {
    return null;
  }

  return {
    cost: shippingCost,
    days: estimatedDays,
  };
}
