"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import { Product } from "@/lib/models/domain/product";
import { ShoppingCart, Plus, Check, Minus } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  product: Product;
  variantId?: string | null;
  quantity?: number;
  size?: "sm" | "default" | "lg";
  className?: string;
}

export default function AddToCartButton({
  product,
  variantId = null,
  quantity = 1,
  size = "default",
  className = "",
}: Props) {
  const { addToCart, cart, updateQuantity } = useCart();
  const [isAdding, setIsAdding] = useState(false);
  const [added, setAdded] = useState(false);

  // ✅ Check if item already exists in cart
  const isInCart = cart.items.some(
    (item) => item.productId === product.id && item.variantId === variantId,
  );

  /* ----------------------------------------
   * STOCK RESOLUTION (SAFE + CORRECT)
   * ---------------------------------------- */

  // Fallback to first variant if no variantId is provided but variants exist
  const variants = product.variants || [];
  const resolvedVariant = variantId
    ? (variants.find((v) => v.id === variantId) ?? null)
    : (variants.length > 0 ? variants[0] : null);

  // For products without variants, if stock is not explicitly set, treat as unlimited (999999)
  // This prevents showing "Out of Stock" for products that don't use stock tracking
  const hasVariants = variants.length > 0;
  const resolvedStock = resolvedVariant
    ? Number(resolvedVariant.stock ?? 0)
    : hasVariants
      ? 0
      : Number(product.stock ?? 999999);

  const existingQty =
    cart.items.find(
      (item) =>
        item.productId === product.id && (item.variantId ?? null) === variantId,
    )?.quantity ?? 0;

  const availableToAdd = Math.max(0, resolvedStock - existingQty);
  const quantityToAdd = Math.min(quantity, availableToAdd);

  /* ---------------------------------------- */

  const isOutOfStock = resolvedStock <= 0;

  const buttonDisabled =
    isAdding || !product.isActive || isOutOfStock || quantityToAdd <= 0;

  const handleAddToCart = async (e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (buttonDisabled || added || isInCart) return;

    setIsAdding(true);

    try {
      addToCart(product.id, variantId, quantityToAdd);
      setAdded(true);

      setTimeout(() => setAdded(false), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (existingQty < resolvedStock) {
      updateQuantity(product.id, existingQty + 1, variantId);
    }
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    // updateQuantity to 0 will remove it via CartContext logic
    updateQuantity(product.id, existingQty - 1, variantId);
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

  if (isInCart && !added && !isAdding) {
    return (
      <div 
        className={cn(
          sizeClasses[size],
          "border-2 border-orange-600 rounded-xl flex items-center justify-between w-full bg-white dark:bg-zinc-950 shadow-md ring-1 ring-orange-100",
          className,
          "bg-white dark:bg-zinc-950 text-orange-600" // Overrides background/text from className
        )} 
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={handleDecrement}
          className="p-1.5 hover:bg-orange-50 dark:hover:bg-zinc-900 rounded-full transition-colors text-orange-600 flex items-center justify-center"
          type="button"
          aria-label="Decrease quantity"
        >
          <Minus className="h-5 w-5 stroke-[3]" />
        </button>
        <span className="font-black min-w-[2ch] text-center text-zinc-900 dark:text-zinc-100 text-lg mr-1">{existingQty}</span>
        <button
          onClick={handleIncrement}
          disabled={existingQty >= resolvedStock}
          className="p-1.5 hover:bg-orange-50 dark:hover:bg-zinc-900 rounded-full transition-colors text-orange-600 flex items-center justify-center disabled:opacity-30"
          type="button"
          aria-label="Increase quantity"
        >
          <Plus className="h-5 w-5 stroke-[3]" />
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col">
      <Button
        onClick={handleAddToCart}
        disabled={buttonDisabled}
        className={`${sizeClasses[size]} ${className} ${
          added ? "bg-green-600 hover:bg-green-700" : ""
        }`}
        size={size}
        title={
          isOutOfStock
            ? "Out of stock"
            : !product.isActive
              ? "Product unavailable"
              : ""
        }
      >
        {isAdding ? (
          <>
            <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
            Adding…
          </>
        ) : added ? (
          <>
            <Check className="h-4 w-4 mr-2" />
            Added
          </>
        ) : (
          <>
            <ShoppingCart className="h-4 w-4 mr-2" />
            Add to Cart
          </>
        )}
      </Button>

      {/* Optional stock message */}
      {isOutOfStock && (
        <span className="mt-1 text-sm text-red-500">Out of stock</span>
      )}
    </div>
  );
}
