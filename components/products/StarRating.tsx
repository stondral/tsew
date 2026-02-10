"use client";

import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

interface StarRatingProps {
  rating: number;
  max?: number;
  size?: number;
  interactive?: boolean;
  onRatingChange?: (rating: number) => void;
  className?: string;
  showText?: boolean;
  count?: number;
}

export default function StarRating({
  rating,
  max = 5,
  size = 16,
  interactive = false,
  onRatingChange,
  className,
  showText = false,
  count,
}: StarRatingProps) {
  const fullStars = Math.floor(rating);
  const hasHalfStar = rating % 1 >= 0.5;

  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex items-center">
        {Array.from({ length: max }).map((_, i) => {
          const starIndex = i + 1;
          const isFull = starIndex <= fullStars;
          const isHalf = !isFull && starIndex === fullStars + 1 && hasHalfStar;

          return (
            <button
              key={i}
              type="button"
              disabled={!interactive}
              onClick={() => onRatingChange?.(starIndex)}
              className={cn(
                "transition-all duration-200 focus:outline-none",
                interactive ? "hover:scale-110 cursor-pointer p-0.5" : "cursor-default"
              )}
            >
              <Star
                size={size}
                className={cn(
                  "transition-colors",
                  isFull || isHalf
                    ? "fill-amber-400 text-amber-400"
                    : "text-slate-200 fill-slate-100"
                )}
              />
            </button>
          );
        })}
      </div>
      
      {showText && (
        <span className="text-sm font-bold text-slate-700">
          {rating.toFixed(1)}
          {count !== undefined && (
            <span className="text-slate-400 font-medium ml-1">({count})</span>
          )}
        </span>
      )}
    </div>
  );
}
