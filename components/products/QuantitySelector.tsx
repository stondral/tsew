"use client";

import { Button } from "@/components/ui/button";
import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface QuantitySelectorProps {
  quantity: number;
  maxQuantity: number;
  onQuantityChange: (quantity: number) => void;
  disabled?: boolean;
}

export default function QuantitySelector({
  quantity,
  maxQuantity,
  onQuantityChange,
  disabled = false,
}: QuantitySelectorProps) {
  const canDecrease = quantity > 1 && !disabled;
  const canIncrease = quantity < maxQuantity && !disabled;

  return (
    <div className="flex items-center gap-3">
      <span className="text-sm font-medium text-gray-700">Quantity:</span>
      <div className="flex items-center rounded-full border border-gray-200 bg-white shadow-sm">
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-l-full transition-colors",
            canDecrease
              ? "hover:bg-orange-50 hover:text-orange-600"
              : "text-gray-300 cursor-not-allowed"
          )}
          onClick={() => canDecrease && onQuantityChange(quantity - 1)}
          disabled={!canDecrease}
        >
          <Minus className="h-4 w-4" />
        </Button>

        <span className="w-12 text-center font-semibold text-gray-900 tabular-nums">
          {quantity}
        </span>

        <Button
          type="button"
          variant="ghost"
          size="icon"
          className={cn(
            "h-10 w-10 rounded-r-full transition-colors",
            canIncrease
              ? "hover:bg-orange-50 hover:text-orange-600"
              : "text-gray-300 cursor-not-allowed"
          )}
          onClick={() => canIncrease && onQuantityChange(quantity + 1)}
          disabled={!canIncrease}
        >
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      {maxQuantity > 0 && maxQuantity <= 10 && (
        <span className="text-sm text-orange-600 font-medium">
          Only {maxQuantity} left!
        </span>
      )}
    </div>
  );
}
