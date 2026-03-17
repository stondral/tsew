"use client";

import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

export function OrdersListSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50/50 py-8 md:py-12 px-4 md:px-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6 md:mb-8">
          <div className="flex items-center gap-4">
            <Skeleton className="w-10 h-10 rounded-lg" />
            <Skeleton className="h-10 w-48 rounded-xl" />
          </div>
          <Skeleton className="h-6 w-32 rounded-lg" />
        </div>

        <div className="space-y-4">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i} className="p-4 md:p-6 rounded-2xl border-gray-100 shadow-sm">
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <Skeleton className="w-12 h-12 md:w-14 md:h-14 rounded-xl flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-5 w-24 rounded" />
                      <Skeleton className="h-4 w-32 rounded" />
                    </div>
                    <Skeleton className="h-6 w-3/4 rounded-lg" />
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-50">
                  <div className="space-y-2">
                    <Skeleton className="h-7 w-28 rounded-lg" />
                    <div className="flex gap-2">
                      <Skeleton className="h-5 w-16 rounded-md" />
                      <Skeleton className="h-5 w-20 rounded-md" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-6 rounded-full" />
                </div>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
