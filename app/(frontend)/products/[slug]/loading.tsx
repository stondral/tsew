import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="min-h-screen bg-white">
      {/* Skeleton for Breadcrumbs */}
      <div className="border-b pt-6">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center gap-4">
          <Skeleton className="h-9 w-24 rounded-lg" />
          <Skeleton className="h-5 w-64 rounded-md" />
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images Skeleton */}
          <div className="space-y-4">
            <Skeleton className="aspect-[3/4] w-full rounded-3xl" />
            <div className="flex gap-3 overflow-x-auto pb-2">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="w-20 h-20 rounded-xl flex-shrink-0" />
              ))}
            </div>
          </div>

          {/* Right Column - Product Info Skeleton */}
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <Skeleton className="h-6 w-24 rounded-full" />
              <Skeleton className="h-6 w-40 rounded-md" />
            </div>
            <Skeleton className="h-12 w-full md:w-3/4 rounded-lg" />
            <Skeleton className="h-24 w-full rounded-2xl" />
            
            <div className="space-y-2">
              <Skeleton className="h-10 w-32 rounded-md" />
              <Skeleton className="h-4 w-48 rounded-md" />
            </div>

            <div className="space-y-4 pt-6">
              <div className="flex gap-3">
                <Skeleton className="h-14 flex-1 rounded-full" />
                <Skeleton className="h-14 w-32 rounded-full" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-6">
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-16 rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
