"use client";

import { ChevronDown, Settings } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "../../auth/AuthContext";

interface TopNavUserMenuProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

export function TopNavUserMenu({ user }: TopNavUserMenuProps) {
  const { logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button className="flex items-center gap-4 pl-1 md:pl-2 pr-1 md:pr-6 py-2 md:py-2.5 hover:bg-white dark:hover:bg-slate-800 rounded-[1.5rem] transition-all border border-transparent hover:border-slate-100 dark:hover:border-slate-700 shadow-sm hover:shadow-xl dark:shadow-black/20 group relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-amber-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            <div className="relative">
                <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-white dark:ring-slate-900 shadow-xl transition-all group-hover:scale-110 shrink-0">
                    <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'seller'}`} />
                    <AvatarFallback className="bg-amber-500 text-white font-black text-xs uppercase">{user?.username ? (user.username as string).substring(0, 2) : 'SE'}</AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 md:h-4 md:w-4 bg-emerald-500 border-2 border-white dark:border-slate-900 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.7)]" />
            </div>
            <div className="hidden md:flex flex-col items-start text-left shrink-0 relative z-10">
                <div className="flex items-center gap-2.5">
                    <span className="text-sm font-black text-slate-900 dark:text-white leading-none tracking-tight">{user?.username || 'Seller'}</span>
                    <ChevronDown className="h-4 w-4 text-slate-400 group-hover:translate-y-0.5 transition-transform" />
                </div>
                <div className="flex items-center gap-2 mt-1.5">
                    <span className="h-1 w-1 bg-emerald-500 rounded-full" />
                    <span className="text-[8px] font-black text-emerald-500 uppercase tracking-[0.25em]">Live</span>
                </div>
            </div>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-[280px] sm:w-80 mt-5 rounded-[2.5rem] sm:rounded-[3rem] p-4 sm:p-5 border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shadow-2xl" align="end">
        <div className="px-4 py-8 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] mb-4 flex flex-col items-center text-center relative overflow-hidden">
            <div className="absolute -top-10 -right-10 h-32 w-32 bg-amber-500/5 rounded-full blur-3xl" />
            <Avatar className="h-16 w-16 sm:h-20 sm:w-20 mb-4 ring-4 ring-white dark:ring-slate-700 shadow-2xl scale-110">
                <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'seller'}`} />
            </Avatar>
            <div className="flex flex-col">
                <p className="text-base sm:text-lg font-black text-slate-900 dark:text-white leading-tight">{user?.username || 'Premium Merchant'}</p>
                <p className="text-[10px] sm:text-xs font-bold text-slate-400 uppercase tracking-widest mt-1.5 truncate max-w-[200px]">{user?.email}</p>
            </div>
            <div className="mt-6 w-full px-2">
                <div className="flex justify-between items-end mb-2">
                    <span className="text-[9px] font-black text-amber-500 uppercase tracking-widest">Trust Level</span>
                    <span className="text-[9px] font-black text-slate-400 uppercase">98%</span>
                </div>
                <div className="h-1.5 w-full bg-slate-100 dark:bg-slate-700/50 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full w-[98%] shadow-[0_0_10px_rgba(245,158,11,0.5)]" />
                </div>
            </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="p-3 sm:p-4 bg-emerald-500/5 dark:bg-emerald-500/10 rounded-2xl border border-emerald-500/10 text-center">
                <p className="text-[9px] font-black text-emerald-600/60 uppercase tracking-widest">Node</p>
                <p className="text-xs font-black text-emerald-600 uppercase mt-1">Active</p>
            </div>
            <div className="p-3 sm:p-4 bg-amber-500/5 dark:bg-amber-500/10 rounded-2xl border border-amber-500/10 text-center">
                <p className="text-[9px] font-black text-amber-600/60 uppercase tracking-widest">Plan</p>
                <p className="text-xs font-black text-amber-600 uppercase mt-1">Elite</p>
            </div>
        </div>
        <div className="space-y-1">
            <Link href="/profile" className="w-full">
                <DropdownMenuItem className="rounded-2xl px-5 py-3.5 gap-4 font-black text-[10px] uppercase tracking-widest text-slate-600 dark:text-slate-400 focus:bg-amber-500 focus:text-white cursor-pointer transition-all border border-transparent">
                    <Settings className="h-4 w-4 md:h-5 md:w-5" /> Preferences
                </DropdownMenuItem>
            </Link>
        </div>
        <DropdownMenuSeparator className="bg-slate-100 dark:bg-slate-800 my-4 h-px opacity-50" />
        <DropdownMenuItem 
            className="rounded-2xl px-5 py-3.5 gap-4 font-black text-[10px] uppercase tracking-[0.2em] text-rose-500 focus:bg-rose-500 focus:text-white cursor-pointer transition-all border border-transparent group/out"
            onClick={handleLogout}
        >
            Destroy Session
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
