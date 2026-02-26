'use client';

import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/components/auth/AuthContext';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchOrders(userId: string): Promise<any[]> {
    const res = await fetch(`/api/orders/list?userId=${userId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch orders');
    }
    const data = await res.json();
    return data.orders || [];
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function fetchOrderDetails(orderId: string): Promise<any> {
    const res = await fetch(`/api/orders/${orderId}`);
    if (!res.ok) {
        throw new Error('Failed to fetch order details');
    }
    const data = await res.json();
    return data.order;
}

export function useOrders() {
    const { user, isAuthenticated } = useAuth();
    const userId = user?.id;

    const {
        data: orders = [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['orders', 'list', userId],
        queryFn: () => fetchOrders(userId as string),
        enabled: isAuthenticated && !!userId,
        staleTime: 5 * 60 * 1000, // Cache for 5 mins
    });

    return {
        orders,
        isLoading,
        error,
        refetch
    };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function useOrder(orderId: string, initialData?: any) {
    const { isAuthenticated } = useAuth();

    const {
        data: order = initialData,
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: ['orders', 'detail', orderId],
        queryFn: () => fetchOrderDetails(orderId),
        enabled: isAuthenticated && !!orderId,
        initialData: initialData,
        staleTime: 10 * 60 * 1000, // 10 minutes cache since past orders rarely change perfectly
    });

    return {
        order,
        isLoading: isLoading && (!initialData && !order),
        error,
        refetch
    };
}
