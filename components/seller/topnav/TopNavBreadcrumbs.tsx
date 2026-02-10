"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";

export function TopNavBreadcrumbs() {
  const pathname = usePathname();
  const pathParts = (pathname || "").split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    let href = "/" + pathParts.slice(0, index + 1).join("/");
    // Map root seller path to dashboard
    if (href === "/seller") href = "/seller/dashboard";
    
    return {
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
      href,
      active: index === pathParts.length - 1
    };
  });

  return (
    <div className="w-full mt-2 hidden sm:flex items-center gap-2 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-500">
        <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] shrink-0">
           <span className="text-amber-500">●</span>
           <span>Path</span>
        </div>
        <div className="h-px w-8 bg-slate-200 dark:bg-slate-800 shrink-0" />
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mask-fade-right">
          {breadcrumbs.map((bc, i) => (
              <div key={`${bc.href}-${i}`} className="flex items-center gap-2 shrink-0 group">
                  {i > 0 && <span className="text-slate-300 dark:text-slate-700 text-[10px] font-black">/</span>}
                  <Link 
                      href={bc.href}
                      className={cn(
                          "text-[11px] md:text-xs font-black transition-all whitespace-nowrap tracking-widest uppercase hover:underline decoration-2 underline-offset-4 decoration-amber-500",
                          bc.active 
                              ? "text-slate-900 dark:text-white" 
                              : "text-slate-400 dark:text-slate-500 hover:text-amber-600 dark:hover:text-amber-400"
                      )}
                  >
                      {bc.label}
                  </Link>
              </div>
          ))}
        </div>
    </div>
  );
}
