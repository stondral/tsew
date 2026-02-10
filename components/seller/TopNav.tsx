"use client";

import { useState, useEffect } from "react";
import { Moon, Sun, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";

import { TopNavMobile } from "./topnav/TopNavMobile";
import { TopNavSearch } from "./topnav/TopNavSearch";
import { TopNavNotifications } from "./topnav/TopNavNotifications";
import { TopNavUserMenu } from "./topnav/TopNavUserMenu";
import { TopNavBreadcrumbs } from "./topnav/TopNavBreadcrumbs";

interface TopNavProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

export function TopNav({ user }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className={cn(
        "sticky top-0 z-40 transition-all duration-700 flex flex-col justify-center",
        scrolled 
            ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-black/20 py-4 px-4 md:px-8 lg:px-14" 
            : "bg-transparent py-6 px-4 md:px-8 lg:px-14"
    )}>
      <div className="flex items-center justify-between gap-6 w-full">
        {/* Mobile Menu & Logo Area */}
        <TopNavMobile user={user} />

        {/* Desktop Command Search */}
        <TopNavSearch />

        <div className="flex items-center gap-2 md:gap-5 shrink-0">
          <div className="flex items-center gap-1 md:gap-1.5 bg-slate-50/50 dark:bg-slate-800/50 p-1 md:p-1.5 rounded-[1.25rem] border border-white dark:border-slate-800 backdrop-blur-md">
            <TopNavNotifications />

            <Button 
              onClick={toggleTheme}
              variant="ghost" 
              size="icon" 
              className="h-9 w-9 md:h-10 md:w-10 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all"
            >
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
            </Button>
            
            <Link href="/" target="_blank" className="hidden xs:block">
                <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all">
                    <ExternalLink className="h-5 w-5" />
                </Button>
            </Link>
          </div>
          
          <div className="h-11 w-px bg-slate-100 dark:bg-slate-800/60 mx-1 hidden md:block" />

          {/* User Profile Menu */}
          <TopNavUserMenu user={user} />
        </div>
      </div>
      
      {/* Breadcrumbs Row */}
      <TopNavBreadcrumbs />
    </div>
  );
}
