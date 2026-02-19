import React from 'react';

export default function ProductLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 py-12 md:py-20 animate-pulse">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Gallery Skeleton */}
        <div className="space-y-4">
          <div className="aspect-[4/5] bg-slate-100 rounded-[2rem]" />
          <div className="flex gap-4">
            <div className="h-24 w-24 bg-slate-100 rounded-2xl" />
            <div className="h-24 w-24 bg-slate-100 rounded-2xl" />
            <div className="h-24 w-24 bg-slate-100 rounded-2xl" />
          </div>
        </div>

        {/* Info Skeleton */}
        <div className="space-y-6 py-4">
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-1/4" />
            <div className="h-10 bg-slate-100 rounded w-3/4" />
          </div>
          
          <div className="h-8 bg-slate-100 rounded w-1/3" />
          
          <div className="space-y-2">
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-full" />
            <div className="h-4 bg-slate-100 rounded w-2/3" />
          </div>

          <div className="h-16 bg-slate-100 rounded-2xl w-full mt-12" />
        </div>
      </div>
    </div>
  );
}
