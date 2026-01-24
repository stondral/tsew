"use client";

import { Button } from "@/components/ui/button";
import { 
  Search, 
  Bell, 
  Moon, 
  User,
  Settings,
  ChevronDown
} from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import Link from "next/link";

interface TopNavProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

export function TopNav({ user }: TopNavProps) {
  return (
    <div className="h-24 bg-white/80 backdrop-blur-md border-b border-slate-100 flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
      <div className="flex items-center flex-1 max-w-xl">
        <div className="relative w-full group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
            <Input 
                placeholder="Search products, orders, analytics..." 
                className="pl-12 h-12 bg-slate-50 border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 w-full rounded-2xl transition-all font-medium text-sm shadow-inner"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 opacity-20 group-focus-within:opacity-40 transition-opacity">
                <span className="text-[10px] font-black border border-slate-400 px-1.5 py-0.5 rounded-md">⌘</span>
                <span className="text-[10px] font-black border border-slate-400 px-1.5 py-0.5 rounded-md">K</span>
            </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="flex items-center bg-slate-50 p-1 rounded-2xl border border-slate-100">
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-amber-600 hover:bg-white rounded-xl transition-all">
                <Bell className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-amber-600 hover:bg-white rounded-xl transition-all">
                <Moon className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" className="h-10 w-10 text-slate-500 hover:text-amber-600 hover:bg-white rounded-xl transition-all">
                <Settings className="h-5 w-5" />
            </Button>
        </div>
        
        <div className="h-8 w-px bg-slate-100 mx-2" />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-3 pl-2 pr-4 py-2 hover:bg-slate-50 rounded-2xl transition-all border border-transparent hover:border-slate-100 group">
                <div className="relative">
                    <Avatar className="h-10 w-10 ring-2 ring-white shadow-md transition-transform group-hover:scale-105">
                        <AvatarImage src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user?.username || 'seller'}`} />
                        <AvatarFallback className="bg-amber-500 text-white font-bold">{user?.username ? (user.username as string).substring(0, 2).toUpperCase() : 'SE'}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-500 border-2 border-white rounded-full" />
                </div>
                <div className="flex flex-col items-start text-left">
                    <span className="text-sm font-black text-slate-900 leading-none mb-1">{user?.username || 'Seller'}</span>
                    <div className="flex items-center gap-1.5">
                         <span className="text-[10px] font-black text-amber-600 uppercase tracking-tighter bg-amber-50 px-1.5 py-0.5 rounded">
                            {user?.role ? (user.role as string).charAt(0).toUpperCase() + (user.role as string).slice(1) : 'Seller'}
                         </span>
                         <ChevronDown className="h-3 w-3 text-slate-400 group-hover:text-amber-500 transition-colors" />
                    </div>
                </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-64 mt-3 rounded-3xl p-3 border border-slate-100 shadow-2xl shadow-slate-200/50" align="end">
            <div className="px-3 py-4 bg-slate-50 rounded-2xl mb-2">
                <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Authenticated as</p>
                <p className="text-sm font-bold text-slate-900 truncate">{user?.email}</p>
            </div>
            <DropdownMenuItem className="rounded-xl px-4 py-3 gap-3 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer">
                <User className="h-4 w-4" /> Profile Details
            </DropdownMenuItem>
            <DropdownMenuItem className="rounded-xl px-4 py-3 gap-3 font-bold text-slate-600 focus:bg-amber-50 focus:text-amber-600 cursor-pointer">
                <Settings className="h-4 w-4" /> Account Settings
            </DropdownMenuItem>
            <DropdownMenuSeparator className="bg-slate-50 my-2 h-0.5" />
            <Link href="/logout" className="w-full">
                <DropdownMenuItem className="rounded-xl px-4 py-3 gap-3 font-bold text-rose-500 focus:bg-rose-50 focus:text-rose-600 cursor-pointer">
                    Sign Out Account
                </DropdownMenuItem>
            </Link>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
  );
}
