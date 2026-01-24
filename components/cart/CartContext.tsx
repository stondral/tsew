"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

import { CartClient, CartContextType } from "./cart.types";
import { loadCart, saveCart } from "./cart.storage";
import { upsertItem } from "./cart.utils";

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartClient>({ items: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    console.log("🛒 CartProvider mounted, loading cart from localStorage...");
    setCart(loadCart());
    setIsLoading(false);
  }, []);

  useEffect(() => {
    if (!isLoading) saveCart(cart);
  }, [cart, isLoading]);

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

  const clearCart = () => setCart({ items: [] });

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
