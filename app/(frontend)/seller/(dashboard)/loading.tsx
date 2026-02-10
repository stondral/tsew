export default function SellerLoading() {
  return (
    <div className="flex flex-col space-y-8 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-8">
        <div className="space-y-4">
          <div className="h-4 w-40 bg-slate-200 dark:bg-slate-800 rounded-full animate-pulse" />
          <div className="h-12 w-64 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
        <div className="flex gap-3">
          <div className="h-14 w-32 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
          <div className="h-14 w-40 bg-slate-200 dark:bg-slate-800 rounded-2xl animate-pulse" />
        </div>
      </div>
      
      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        ))}
      </div>

      <div className="grid gap-12 lg:grid-cols-3">
        <div className="lg:col-span-2 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
        <div className="lg:col-span-1 h-[400px] bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
      </div>

      <div className="h-96 bg-slate-200 dark:bg-slate-800 rounded-3xl animate-pulse" />
    </div>
  );
}
