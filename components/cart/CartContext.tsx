"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
  useRef,
} from "react";

import { CartClient, CartContextType } from "./cart.types";
import { loadCart, saveCart, clearCart as clearLocalCart } from "./cart.storage";
import { upsertItem } from "./cart.utils";
import { fetchCartFromDB, syncCartToDB, mergeGuestCart } from "./cart.api";
import { useAuth } from "@/components/auth/AuthContext";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ 
  children,
  initialCart 
}: { 
  children: ReactNode;
  initialCart?: CartClient;
}) {
  const [cart, setCart] = useState<CartClient>(initialCart || { items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(!initialCart);
  const { isAuthenticated } = useAuth();
  
  const syncTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isMountedRef = useRef(false);

  // Load cart on mount or when auth status changes
  useEffect(() => {
    async function initializeCart() {
      // If we have initialCart from server, skip fetch
      if (initialCart) {
        console.log("🛒 Using server-provided cart");
        setIsLoading(false);
        isMountedRef.current = true;
        return;
      }
      
      console.log("🛒 Initializing cart, authenticated:", isAuthenticated);

      if (isAuthenticated) {
        // Load from database
        console.log("🛒 Loading cart from database...");
        const dbCart = await fetchCartFromDB();
        
        // Check if there's a guest cart in localStorage
        const guestCart = loadCart();
        
        if (guestCart.items.length > 0) {
          // Merge guest cart with DB cart
          console.log("🛒 Merging guest cart with DB cart...");
          const mergedCart = await mergeGuestCart(guestCart);
          setCart(mergedCart);
          
          // Clear localStorage after successful merge
          clearLocalCart();
        } else {
          setCart(dbCart);
        }
      } else {
        // Load from localStorage for guest users
        console.log("🛒 Loading cart from localStorage (guest)...");
        setCart(loadCart());
      }

      setIsLoading(false);
      isMountedRef.current = true;
    }

    initializeCart();
  }, [isAuthenticated, initialCart]);

  // Debounced sync to database
  const debouncedSyncToDB = useCallback((cartToSync: CartClient) => {
    if (!isAuthenticated || !isMountedRef.current) return;

    // Clear existing timeout
    if (syncTimeoutRef.current) {
      clearTimeout(syncTimeoutRef.current);
    }

    // Set new timeout
    syncTimeoutRef.current = setTimeout(() => {
      console.log("🛒 Syncing cart to database...");
      syncCartToDB(cartToSync);
    }, 1000); // 1 second debounce
  }, [isAuthenticated]);

  // Save cart changes
  useEffect(() => {
    if (!isMountedRef.current || isLoading) return;

    if (isAuthenticated) {
      // Save to localStorage as backup + sync to DB
      saveCart(cart);
      debouncedSyncToDB(cart);
    } else {
      // Guest users: only localStorage
      saveCart(cart);
    }
  }, [cart, isLoading, isAuthenticated, debouncedSyncToDB]);

  const addToCart = (
    productId: string,
    variantId: string | null = null,
    quantity = 1,
  ) => {
    console.log("🛒 Adding to cart:", { productId, variantId, quantity });

    setCart((prev) => {
      const newCart = {
        items: upsertItem(prev.items, {
          productId,
          variantId,
          quantity,
        }),
      };
      console.log("🛒 New cart state:", newCart);
      return newCart;
    });
  };

  const removeFromCart = (
    productId: string,
    variantId: string | null = null,
  ) => {
    setCart((prev) => ({
      items: prev.items.filter(
        (i) =>
          !(i.productId === productId && (i.variantId ?? null) === variantId),
      ),
    }));
  };

  const updateQuantity = (
    productId: string,
    quantity: number,
    variantId: string | null = null,
  ) => {
    if (quantity <= 0) {
      removeFromCart(productId, variantId);
      return;
    }

    setCart((prev) => ({
      items: prev.items.map((i) =>
        i.productId === productId && (i.variantId ?? null) === variantId
          ? { ...i, quantity }
          : i,
      ),
    }));
  };

  const clearCart = () => {
    setCart({ items: [] });
    if (isAuthenticated) {
      // Also clear from database
      syncCartToDB({ items: [] });
    }
  };

  const value: CartContextType = {
    cart,
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
    isOpen,
    setIsOpen,
    isLoading,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used inside CartProvider");
  }
  return ctx;
}
