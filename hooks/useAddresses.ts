'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { AddressInput, createAddressAction, updateAddressAction, deleteAddressAction, setDefaultAddressAction } from '@/app/(frontend)/profile/addresses/actions';
import { useAuth } from '@/components/auth/AuthContext';

export interface Address {
    id: string;
    label: string;
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    address: string;
    apartment: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    addressType: "home" | "work" | "other";
    isDefault: boolean;
}

/**
 * Hook for managing user addresses using Server Actions internally but
 * providing optimistic updates via TanStack query
 */
export function useAddresses(initialAddresses?: Address[]) {
    const queryClient = useQueryClient();
    const { isAuthenticated } = useAuth();
    const QUERY_KEY = ['addresses'];

    const {
        data: addresses = initialAddresses || [],
        isLoading,
        error,
        refetch
    } = useQuery({
        queryKey: QUERY_KEY,
        queryFn: async () => {
            // Since PayloadCMS relies on Server Actions passing initial data to this page,
            // we just use the initialData provided by the SSR layout, but allow TanStack
            // to take over state management for optimistic updates.
            return initialAddresses || [];
        },
        initialData: initialAddresses,
        enabled: isAuthenticated,
    });

    const { mutateAsync: addAddress, isPending: isAdding } = useMutation({
        mutationFn: createAddressAction,
        onMutate: async (newAddress) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY });
            const previousAddresses = queryClient.getQueryData<Address[]>(QUERY_KEY) || [];

            const optimisticAddress: Address = {
                id: `temp-id-${Date.now()}`,
                label: newAddress.label || `${newAddress.firstName}'s ${newAddress.addressType || "Home"}`,
                firstName: newAddress.firstName,
                lastName: newAddress.lastName,
                email: newAddress.email,
                phone: newAddress.phone,
                address: newAddress.address,
                apartment: newAddress.apartment || "",
                city: newAddress.city,
                state: newAddress.state,
                postalCode: newAddress.postalCode,
                country: newAddress.country || "India",
                addressType: newAddress.addressType || "home",
                isDefault: newAddress.isDefault || false,
            };

            if (optimisticAddress.isDefault) {
                queryClient.setQueryData<Address[]>(QUERY_KEY, prev =>
                    (prev || []).map(addr => ({ ...addr, isDefault: false })).concat(optimisticAddress)
                );
            } else {
                queryClient.setQueryData<Address[]>(QUERY_KEY, prev => [...(prev || []), optimisticAddress]);
            }

            return { previousAddresses };
        },
        onError: (err, newAddress, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.previousAddresses);
        },
        onSettled: () => {
            // In a real app we'd fetch the exact list again, but server actions use revalidatePath
            // so we rely on the router refreshing the page. But we still invalidate to be safe.
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });

    const { mutateAsync: updateAddress, isPending: isUpdating } = useMutation({
        mutationFn: ({ id, data }: { id: string, data: AddressInput }) => updateAddressAction(id, data),
        onMutate: async ({ id, data }) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY });
            const previousAddresses = queryClient.getQueryData<Address[]>(QUERY_KEY) || [];

            queryClient.setQueryData<Address[]>(QUERY_KEY, prev =>
                (prev || []).map(addr => {
                    if (addr.id === id) {
                        return { ...addr, ...data, label: data.label || addr.label } as Address;
                    }
                    if (data.isDefault) {
                        return { ...addr, isDefault: false };
                    }
                    return addr;
                })
            );
            return { previousAddresses };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.previousAddresses);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });

    const { mutateAsync: deleteAddress, isPending: isDeleting } = useMutation({
        mutationFn: deleteAddressAction,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY });
            const previousAddresses = queryClient.getQueryData<Address[]>(QUERY_KEY) || [];
            queryClient.setQueryData<Address[]>(QUERY_KEY, prev => (prev || []).filter(addr => addr.id !== id));
            return { previousAddresses };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.previousAddresses);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });

    const { mutateAsync: setDefaultAddress, isPending: isSettingDefault } = useMutation({
        mutationFn: setDefaultAddressAction,
        onMutate: async (id) => {
            await queryClient.cancelQueries({ queryKey: QUERY_KEY });
            const previousAddresses = queryClient.getQueryData<Address[]>(QUERY_KEY) || [];
            queryClient.setQueryData<Address[]>(QUERY_KEY, prev =>
                (prev || []).map(addr => ({ ...addr, isDefault: addr.id === id }))
            );
            return { previousAddresses };
        },
        onError: (err, variables, context) => {
            queryClient.setQueryData(QUERY_KEY, context?.previousAddresses);
        },
        onSettled: () => {
            queryClient.invalidateQueries({ queryKey: QUERY_KEY });
        }
    });

    return {
        addresses,
        addAddress,
        updateAddress,
        deleteAddress,
        setDefaultAddress,
        isLoading,
        isAdding,
        isUpdating,
        isDeleting,
        isSettingDefault,
    }
}
