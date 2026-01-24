"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ShoppingBag, Trash2, Plus, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "./CartContext";
import { CartItemClient } from "./cart.types";
import { resolveMediaUrl } from "@/lib/media";
import { getProductById } from "@/lib/models/domain/getProductById";
import { Product } from "@/lib/models/domain/product";

interface CartItemProps {
  item: CartItemClient;
}

export default function CartItemComponent({ item }: CartItemProps) {
  const { updateQuantity, removeFromCart } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    getProductById(item.productId).then((p) => {
      if (active) {
        setProduct(p);
        setLoading(false);
      }
    });

    return () => {
      active = false;
    };
  }, [item.productId]);

  if (loading || !product) {
    return (
      <div className="flex items-center gap-4 p-4 border rounded-lg animate-pulse">
        <div className="w-16 h-16 bg-muted rounded-md" />
        <div className="flex-1 space-y-2">
          <div className="h-4 bg-muted rounded w-2/3" />
          <div className="h-3 bg-muted rounded w-1/3" />
        </div>
      </div>
    );
  }

  const variant = item.variantId
    ? product.variants?.find((v) => v.id === item.variantId)
    : undefined;

  const maxStock =
    typeof variant?.stock === "number"
      ? variant.stock
      : typeof product.stock === "number"
        ? product.stock
        : undefined;

  const image = variant?.image || product.images?.[0];

  const price = variant?.price ?? product.price ?? product.basePrice ?? 0;

  return (
    <div className="flex flex-col xs:flex-row items-start xs:items-center gap-4 p-4 border rounded-lg overflow-hidden">
      <div className="w-16 h-16 bg-muted rounded-md flex items-center justify-center overflow-hidden">
        {image ? (
          <Image
            src={resolveMediaUrl(image)}
            alt={product.name}
            width={64}
            height={64}
            className="rounded-md object-cover"
          />
        ) : (
          <ShoppingBag className="h-8 w-8 text-muted-foreground" />
        )}
      </div>

      <div className="flex-1 min-w-0 w-full xs:w-auto">
        <h4 className="font-semibold text-gray-900 group-hover:text-orange-600 transition-colors truncate">{product.name}</h4>
        {variant && (
          <p className="text-xs text-muted-foreground mb-1">{variant.name}</p>
        )}
        <p className="text-sm font-bold text-gray-900">₹{price.toLocaleString()}</p>
        {typeof maxStock === "number" && item.quantity > maxStock && (
          <p className="text-xs text-red-600 font-medium mt-1 flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 bg-red-500 rounded-full"></span>
            Only {maxStock} available
          </p>
        )}
      </div>

      <div className="flex items-center justify-between w-full xs:w-auto gap-4 pt-4 xs:pt-0 border-t xs:border-t-0 border-gray-50">
        <div className="flex items-center gap-3">
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-lg"
            onClick={() =>
              updateQuantity(
                item.productId,
                item.quantity - 1,
                item.variantId ?? undefined,
              )
            }
          >
            <Minus className="h-3 w-3" />
          </Button>
  
          <span className="min-w-[20px] text-center font-bold text-sm">{item.quantity}</span>
  
          <Button
            size="icon"
            variant="outline"
            className="h-8 w-8 rounded-lg"
            disabled={
              typeof maxStock === "number" ? item.quantity >= maxStock : false
            }
            onClick={() =>
              updateQuantity(
                item.productId,
                typeof maxStock === "number"
                  ? Math.min(item.quantity + 1, maxStock)
                  : item.quantity + 1,
                item.variantId ?? undefined,
              )
            }
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        
        <div className="flex items-center gap-2">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-rose-500 hover:text-rose-600 hover:bg-rose-50 rounded-lg"
              onClick={() =>
                removeFromCart(item.productId, item.variantId ?? undefined)
              }
            >
              <Trash2 className="h-4 w-4" />
            </Button>
        </div>
      </div>
    </div>
  );
}
