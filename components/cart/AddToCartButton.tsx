"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import { Product } from "@/lib/models/domain/product";
import { ShoppingCart, Plus, Check } from "lucide-react";

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
  const { addToCart, cart } = useCart();
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

  const handleAddToCart = async () => {
    if (buttonDisabled || added) return;

    setIsAdding(true);

    try {
      addToCart(product.id, variantId, quantityToAdd);
      setAdded(true);

      setTimeout(() => setAdded(false), 2000);
    } finally {
      setIsAdding(false);
    }
  };

  const sizeClasses = {
    sm: "px-3 py-1.5 text-sm",
    default: "px-4 py-2",
    lg: "px-6 py-3 text-lg",
  };

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
        ) : isInCart ? (
          <>
            <Plus className="h-4 w-4 mr-2" />
            Add More
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
