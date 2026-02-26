"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { useAuth } from "@/components/auth/AuthContext";
import { useWishlist as useTanstackWishlist } from "@/hooks/useWishlist";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [guestWishlist, setGuestWishlist] = useState<string[]>([]);
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();

  // TanStack handles the DB/Redis logic for authenticated users
  const { 
    products: serverWishlistIds, 
    isLoading: isServerLoading, 
    toggleWishlist: serverToggleWishlist,
    refetch: refetchServerWishlist
  } = useTanstackWishlist();

  useEffect(() => {
    // Load guest wishlist on mount if not authenticated
    if (!isAuthenticated) {
      const local = localStorage.getItem("stond_wishlist");
      if (local) {
        try {
          setGuestWishlist(JSON.parse(local));
        } catch {
          setGuestWishlist([]);
        }
      }
    }
  }, [isAuthenticated]);

  useEffect(() => {
    // Merge guest wishlist when user logs in
    if (isAuthenticated) {
      const local = localStorage.getItem("stond_wishlist");
      if (local) {
        try {
          const localItems: string[] = JSON.parse(local);
          if (localItems.length > 0) {
            // Merge logic: For now we just sync the items to DB one by one
            // In a complete implementation we might want a bulk merge endpoint
            Promise.all(localItems.map(id => serverToggleWishlist(id)))
              .then(() => {
                localStorage.removeItem("stond_wishlist");
                setGuestWishlist([]);
                refetchServerWishlist();
              });
          }
        } catch (e) {
          console.error("Failed to parse local wishlist on merge", e);
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAuthenticated]);

  const toggleWishlist = async (productId: string) => {
    if (isAuthenticated) {
      await serverToggleWishlist(productId);
    } else {
      const wasWishlisted = guestWishlist.includes(productId);
      const newWishlist = wasWishlisted 
        ? guestWishlist.filter(id => id !== productId)
        : [...guestWishlist, productId];
      
      setGuestWishlist(newWishlist);
      localStorage.setItem("stond_wishlist", JSON.stringify(newWishlist));
      toast.success(wasWishlisted ? "Removed from wishlist" : "Added to wishlist");
    }
  };

  const currentWishlistIds = isAuthenticated ? serverWishlistIds : guestWishlist;
  const isLoading = isAuthLoading || (isAuthenticated && isServerLoading);
  
  const isWishlisted = (productId: string) => currentWishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ 
      wishlistIds: currentWishlistIds, 
      toggleWishlist, 
      isLoading, 
      isWishlisted 
    }}>
      {children}
    </WishlistContext.Provider>
  );
}

export function useWishlist() {
  const context = useContext(WishlistContext);
  if (context === undefined) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
}
