"use client";

import { Skeleton } from "@/components/ui/skeleton";

interface Props {
  view?: "grid" | "list";
}

export default function ProductSkeleton({ view = "grid" }: Props) {
  const isList = view === "list";

  return (
    <div
      className={`relative bg-card rounded-xl border-2 border-gray-100 shadow-sm overflow-hidden w-full flex ${
        isList ? "flex-row gap-4 p-2 h-auto" : "flex-col"
      }`}
    >
      {/* IMAGE SKELETON */}
      <div className={`${isList ? "w-32 sm:w-48 aspect-square rounded-lg shrink-0" : "aspect-[3/4]"} bg-muted overflow-hidden`}>
        <Skeleton className="w-full h-full rounded-none" />
      </div>

      {/* INFO SECTION SKELETON */}
      <div className={`p-3 flex-1 flex flex-col ${isList ? "gap-1" : "gap-2"}`}>
        <div className="flex-1 space-y-2">
          {/* Category */}
          <Skeleton className="h-3 w-1/3 rounded-full" />
          {/* Title */}
          <Skeleton className="h-4 w-3/4 rounded-full" />
          {isList && (
            <div className="space-y-1 pt-2 hidden sm:block">
              <Skeleton className="h-3 w-full rounded-full" />
              <Skeleton className="h-3 w-5/6 rounded-full" />
            </div>
          )}
        </div>

        {/* Variants fallback */}
        <div className="flex gap-1.5 mt-2">
           <Skeleton className="h-6 w-16 rounded-full" />
           <Skeleton className="h-6 w-16 rounded-full" />
        </div>

        {/* PRICE AND ACTION ROW */}
        <div className={`flex ${isList ? "flex-row justify-between items-center" : "flex-col gap-2"} mt-auto pt-2 border-t border-gray-50`}>
          <div className="flex justify-between items-end flex-1 mr-4">
            <div className="space-y-1">
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-3 w-12 rounded-full" />
            </div>
            {!isList && (
              <Skeleton className="h-3 w-8 rounded-full" />
            )}
          </div>

          <div className={`${isList ? "w-40" : "mt-1"}`}>
            <Skeleton className="h-9 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </div>
  );
}
