"use client";

import { ProductVariant } from "@/lib/models/domain/product";
import { cn } from "@/lib/utils";
import Image from "next/image";

interface VariantSelectorProps {
  variants: ProductVariant[];
  selectedVariantId: string | null;
  onSelect: (variantId: string) => void;
}

export default function VariantSelector({
  variants,
  selectedVariantId,
  onSelect,
}: VariantSelectorProps) {
  if (!variants || variants.length === 0) return null;

  // Group variants by attribute name for better display
  const hasImages = variants.some((v) => v.image);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium text-gray-700">Select Variant:</span>
        {selectedVariantId && (
          <span className="text-sm text-orange-600 font-medium">
            {variants.find((v) => v.id === selectedVariantId)?.name}
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-3">
        {variants.map((variant) => {
          const isSelected = variant.id === selectedVariantId;
          const isOutOfStock = variant.stock <= 0;

          return (
            <button
              key={variant.id}
              type="button"
              onClick={() => !isOutOfStock && onSelect(variant.id)}
              disabled={isOutOfStock}
              className={cn(
                "relative group transition-all duration-200",
                hasImages ? "p-1" : "px-4 py-2",
                "rounded-xl border-2",
                isSelected
                  ? "border-orange-500 bg-orange-50 shadow-md shadow-orange-100"
                  : "border-gray-200 hover:border-orange-300 hover:bg-gray-50",
                isOutOfStock && "opacity-50 cursor-not-allowed"
              )}
            >
              {hasImages && variant.image ? (
                <div className="relative w-16 h-16 rounded-lg overflow-hidden">
                  <Image
                    src={variant.image}
                    alt={variant.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <span className="text-[10px] text-white font-medium">OUT</span>
                    </div>
                  )}
                </div>
              ) : (
                <span
                  className={cn(
                    "text-sm font-medium",
                    isSelected ? "text-orange-700" : "text-gray-700"
                  )}
                >
                  {variant.name}
                </span>
              )}

              {/* Attributes tooltip */}
              {variant.attributes && variant.attributes.length > 0 && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none z-10">
                  {variant.attributes.map((attr) => `${attr.name}: ${attr.value}`).join(", ")}
                </div>
              )}

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center">
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
