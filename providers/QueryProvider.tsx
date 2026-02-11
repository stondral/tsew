'use client'

import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { useState } from 'react'

/**
 * QueryProvider - TanStack Query Configuration for Next.js App Router
 * 
 * This provider wraps the application with QueryClientProvider and configures
 * global defaults for caching, stale time, and retry logic.
 * 
 * Performance Optimizations:
 * - staleTime: 5 minutes - Data is considered fresh for 5 minutes
 * - cacheTime: 10 minutes - Unused data is garbage collected after 10 minutes
 * - retry: 2 - Failed queries retry twice before throwing error
 * - refetchOnWindowFocus: false - Prevents unnecessary refetches on tab switch
 */
export default function QueryProvider({ children }: { children: React.ReactNode }) {
  // Create QueryClient instance once per component mount
  // This prevents creating a new client on every render
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            // Data is considered fresh for 5 minutes
            staleTime: 5 * 60 * 1000,
            
            // Unused data is garbage collected after 10 minutes
            gcTime: 10 * 60 * 1000,
            
            // Retry failed queries twice before throwing error
            retry: 2,
            
            // Don't refetch on window focus to reduce unnecessary API calls
            refetchOnWindowFocus: false,
            
            // Refetch on mount only if data is stale
            refetchOnMount: true,
            
            // Don't refetch on reconnect to avoid thundering herd
            refetchOnReconnect: false,
          },
          mutations: {
            // Retry failed mutations once
            retry: 1,
            
            // Network mode - fail if offline
            networkMode: 'online',
          },
        },
      })
  )

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      {/* DevTools only in development */}
      {process.env.NODE_ENV === 'development' && (
        <ReactQueryDevtools 
          initialIsOpen={false} 
          position="bottom"
          buttonPosition="bottom-right"
        />
      )}
    </QueryClientProvider>
  )
}
