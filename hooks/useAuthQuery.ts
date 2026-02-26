'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

interface User {
    id: string;
    email: string;
    username: string;
    phone?: string;
    role: "admin" | "seller" | "user" | "sellerEmployee";
    plan?: "starter" | "pro" | "elite";
    subscriptionId?: string;
    subscriptionStatus?: "active" | "inactive" | "pending" | "cancelled";
    nextBillingDate?: string;
    billingCycle?: "monthly" | "yearly";
}

async function fetchUser(): Promise<User | null> {
    const res = await fetch("/api/users/me", {
        method: "GET",
        credentials: "include",
    });

    if (!res.ok) {
        return null;
    }

    const data = await res.json();
    return data?.user ?? null;
}

export function useAuthQuery() {
    const queryClient = useQueryClient();

    const { data: user = null, isLoading, refetch } = useQuery({
        queryKey: ['user', 'me'],
        queryFn: fetchUser,
        staleTime: 5 * 60 * 1000, // 5 minutes
        gcTime: 10 * 60 * 1000, // 10 minutes
        retry: false, // Do not retry on 401
        refetchOnWindowFocus: true, // Good for auth state
    });

    const invalidateUser = () => {
        queryClient.invalidateQueries({ queryKey: ['user', 'me'] });
    };

    const setUserCache = (newUser: User | null) => {
        queryClient.setQueryData(['user', 'me'], newUser);
    };

    return {
        user,
        isLoading,
        refetch,
        invalidateUser,
        setUserCache,
    };
}
