"use client";

import { Button } from "@/components/ui/button";
import { 
  Moon, 
  Sun,
  Search,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "../auth/AuthContext";
import type { User } from "@/payload-types";

interface AdminTopNavProps {
  user?: (User & { collection: 'users' }) | null;
}

export function AdminTopNav({ user }: AdminTopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();

  const pathParts = (pathname || "").split("/").filter(Boolean);
  const breadcrumbs = pathParts.map((part, index) => {
    const href = "/" + pathParts.slice(0, index + 1).join("/");
    return {
      label: part.charAt(0).toUpperCase() + part.slice(1).replace(/-/g, " "),
      href,
      active: index === pathParts.length - 1
    };
  });

  const handleLogout = async () => {
    await logout();
    router.push("/auth");
  };

  return (
    <div className="h-20 border-b border-slate-200 dark:border-slate-800 bg-white/50 dark:bg-slate-900/50 backdrop-blur-md px-8 flex items-center justify-between shrink-0">
      <div className="flex items-center gap-4">
        {/* Breadcrumbs */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
            {breadcrumbs.map((bc, i) => (
                <div key={bc.href} className="flex items-center gap-2 shrink-0">
                    {i > 0 && <span className="text-slate-300 dark:text-slate-700 text-xs">/</span>}
                    <Link 
                        href={bc.href}
                        className={cn(
                            "text-xs font-bold transition-all uppercase tracking-widest",
                            bc.active 
                                ? "text-slate-900 dark:text-white" 
                                : "text-slate-400 dark:text-slate-500 hover:text-indigo-600"
                        )}
                    >
                        {bc.label}
                    </Link>
                </div>
            ))}
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
                placeholder="Quick search..." 
                className="pl-10 w-64 bg-slate-100 dark:bg-slate-800 border-none rounded-xl text-xs font-bold"
            />
        </div>

        <Button 
            onClick={toggleTheme}
            variant="ghost" 
            size="icon" 
            className="h-10 w-10 text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl"
        >
            {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-2 pr-4 py-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition-all">
                <Avatar className="h-10 w-10 ring-2 ring-white dark:ring-slate-900">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.email || 'admin'}`} />
                    <AvatarFallback className="bg-indigo-600 text-white font-black text-xs uppercase">{user?.email ? user.email.substring(0, 2) : 'AD'}</AvatarFallback>
                </Avatar>
                <div className="hidden sm:flex flex-col items-start text-left">
                    <span className="text-xs font-black text-slate-900 dark:text-white leading-tight">{user?.email?.split('@')[0] || 'Admin'}</span>
                    <span className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">Administrator</span>
                </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56 mt-2 rounded-2xl p-2" align="end">
            <DropdownMenuItem className="rounded-xl px-4 py-2 text-xs font-bold cursor-pointer">
                Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl px-4 py-2 text-xs font-bold cursor-pointer text-rose-500 focus:bg-rose-500 focus:text-white" onClick={handleLogout}>
                Logout Session
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
