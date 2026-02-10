"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { toggleWishlist as toggleWishlistAction, getWishlist } from "@/app/(frontend)/products/actions/wishlist";
import { useAuth } from "@/components/auth/AuthContext";
import { toast } from "sonner";

interface WishlistContextType {
  wishlistIds: string[];
  toggleWishlist: (productId: string) => Promise<void>;
  isLoading: boolean;
  isWishlisted: (productId: string) => boolean;
}

const WishlistContext = createContext<WishlistContextType | undefined>(undefined);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const [wishlistIds, setWishlistIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    async function fetchWishlist() {
      if (isAuthenticated) {
        setIsLoading(true);
        try {
          const res = await getWishlist();
          if (res.ok && res.products) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            setWishlistIds(res.products.map((p: any) => (p && typeof p === 'object') ? p.id : p));
          }
        } catch (err) {
          console.error("Failed to fetch wishlist:", err);
        }
      } else {
        setWishlistIds([]);
      }
      setIsLoading(false);
    }
    fetchWishlist();
  }, [isAuthenticated]);

  const toggleWishlist = async (productId: string) => {
    if (!isAuthenticated) {
      toast.error("Please login to save items to your wishlist.");
      return;
    }

    // Optimistic update
    const wasWishlisted = wishlistIds.includes(productId);
    if (wasWishlisted) {
      setWishlistIds(prev => prev.filter(id => id !== productId));
    } else {
      setWishlistIds(prev => [...prev, productId]);
    }

    try {
      const res = await toggleWishlistAction(productId);
      if (!res.ok) {
        // Revert on error
        if (wasWishlisted) {
          setWishlistIds(prev => [...prev, productId]);
        } else {
          setWishlistIds(prev => prev.filter(id => id !== productId));
        }
        toast.error(res.error || "Failed to update wishlist");
      } else {
        toast.success(res.wishlisted ? "Added to wishlist" : "Removed from wishlist");
      }
    } catch {
      // Revert on crash
      if (wasWishlisted) {
        setWishlistIds(prev => [...prev, productId]);
      } else {
        setWishlistIds(prev => prev.filter(id => id !== productId));
      }
      toast.error("An error occurred. Please try again.");
    }
  };

  const isWishlisted = (productId: string) => wishlistIds.includes(productId);

  return (
    <WishlistContext.Provider value={{ wishlistIds, toggleWishlist, isLoading, isWishlisted }}>
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
