"use client";

import { Button } from "@/components/ui/button";
import { 
  Search, 
  Bell, 
  Moon, 
  Sun,
  Settings,
  ChevronDown,
  Menu,
  Sparkles,
  ShoppingBag,
  ExternalLink,
  MessageSquare,
  AlertCircle,
  Command,
  Zap,
  ArrowUpRight
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
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import Link from "next/link";
import { useTheme } from "@/components/ThemeProvider";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { getSellerNotificationsAction } from "../../app/(frontend)/seller/actions/notifications";
import { useAuth } from "../auth/AuthContext";
import { Sidebar } from "./Sidebar";
import { usePathname, useRouter } from "next/navigation";
import { useState, useEffect, useMemo } from "react";

interface TopNavProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

export function TopNav({ user }: TopNavProps) {
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();
  const { logout } = useAuth();
  const router = useRouter();
  const [scrolled, setScrolled] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    // Fetch real notifications
    const fetchNotifications = async () => {
      const response = await getSellerNotificationsAction();
      if (response.ok && response.notifications) {
        setNotifications(response.notifications);
      }
    };
    fetchNotifications();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const pathParts = pathname.split("/").filter(Boolean);
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

  const mockSearchResults = useMemo(() => {
    if (!searchQuery) return [];
    return [
      { id: 1, type: "Order", title: "ORD-9283-A", subtitle: "Customer: Jane Doe", icon: ShoppingBag },
      { id: 2, type: "Product", title: "Premium Cotton Tee", subtitle: "24 in stock", icon: Zap },
      { id: 3, type: "Setting", title: "Payment Gateways", subtitle: "Configure Razorpay", icon: Settings },
    ].filter(i => 
        i.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
        i.type.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  interface Notification { id: string; title: string; description: string; time: string; type: string; read: boolean; priority: string }
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const getNotificationStyles = (type: string) => {
    switch(type) {
        case 'order': return { icon: ShoppingBag, color: "text-emerald-500 bg-emerald-50 dark:bg-emerald-500/10" };
        case 'message': return { icon: MessageSquare, color: "text-blue-500 bg-blue-50 dark:bg-blue-500/10" };
        case 'alert': return { icon: AlertCircle, color: "text-amber-500 bg-amber-50 dark:bg-amber-500/10" };
        case 'system': return { icon: Zap, color: "text-purple-500 bg-purple-50 dark:bg-purple-500/10" };
        default: return { icon: Bell, color: "text-slate-500 bg-slate-50 dark:bg-slate-500/10" };
    }
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  const handleMarkAsRead = (id: string) => {
    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n));
  };

  const handleMarkAllRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
  };



  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  return (
    <div className={cn(
        "sticky top-0 z-40 transition-all duration-700 flex flex-col justify-center",
        scrolled 
            ? "bg-white/80 dark:bg-slate-900/80 backdrop-blur-2xl border-b border-slate-100 dark:border-slate-800 shadow-xl shadow-slate-200/20 dark:shadow-black/20 py-4 px-4 md:px-8 lg:px-14" 
            : "bg-transparent py-6 px-4 md:px-8 lg:px-14"
    )}>
      <div className="flex items-center justify-between gap-6 w-full">
        {/* Mobile Menu Trigger & Logo Area */}
        <div className="flex items-center gap-4 shrink-0">
            <Sheet>
            <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="lg:hidden shrink-0 dark:text-slate-400 dark:hover:text-amber-500 bg-white/50 dark:bg-slate-800/50 backdrop-blur-md rounded-xl shadow-sm border border-white dark:border-slate-700">
                <Menu className="h-5 w-5 md:h-6 md:w-6" />
                </Button>
            </SheetTrigger>
            <SheetContent side="left" className="p-0 w-[280px] sm:w-[320px] border-r-0">
                <Sidebar user={user} className="w-full h-full" />
            </SheetContent>
            </Sheet>
            
            {/* Navigating Node Label - Visible on Desktop */}
            <div className="hidden lg:flex items-center gap-2 text-slate-400 dark:text-slate-500 font-black text-[10px] uppercase tracking-[0.2em]">
                <Sparkles className="h-3 w-3 text-amber-500 animate-pulse" />
                <span>Navigating Node</span>
            </div>
        </div>

        {/* Creative Command Search - Now Centered and Wider */}
        <div className="relative w-full group hidden lg:block max-w-2xl mx-auto">
            <div className={cn(
                "absolute inset-0 bg-amber-500/20 rounded-[1.5rem] blur-2xl transition-opacity duration-500",
                searchFocused ? "opacity-30" : "opacity-0"
            )} />
            <Search className={cn(
                "absolute left-6 top-1/2 -translate-y-1/2 h-5 w-5 transition-colors z-10",
                searchFocused ? "text-amber-500" : "text-slate-400"
            )} />
            <Input 
                placeholder="Type command or search assets..." 
                value={searchQuery}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 h-14 bg-white/60 dark:bg-slate-800/60 border-none ring-1 ring-slate-200 dark:ring-slate-700/50 focus-visible:ring-2 focus-visible:ring-amber-500/50 w-full rounded-[1.5rem] transition-all font-bold text-xs md:text-sm shadow-lg shadow-slate-200/20 dark:shadow-black/20 text-slate-900 dark:text-slate-100 placeholder:text-slate-400/60 z-10 backdrop-blur-xl"
            />
            <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden xl:flex items-center gap-2 z-10">
                <div className="bg-slate-100 dark:bg-slate-700/50 p-1.5 rounded-lg border border-slate-200 dark:border-slate-600 shadow-sm">
                    <Command className="h-3 w-3 text-slate-400 dark:text-slate-500" />
                </div>
                <span className="text-[10px] font-black text-slate-300 dark:text-slate-600">K</span>
            </div>

            {/* Quick Search Results Popup */}
            {searchFocused && (
                <div className="absolute top-16 left-0 right-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl border border-white dark:border-slate-800 rounded-[2rem] shadow-2xl p-3 z-[100] animate-in slide-in-from-top-4 duration-300">
                    <div className="p-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-3 px-2">Quick Results</p>
                        {searchQuery ? (
                            <div className="space-y-1">
                                {mockSearchResults.length > 0 ? mockSearchResults.map(item => (
                                    <div key={item.id} className="flex items-center gap-4 p-3 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-2xl cursor-pointer group/item transition-colors">
                                        <div className="h-10 w-10 bg-amber-500/10 rounded-xl flex items-center justify-center shrink-0">
                                            <item.icon className="h-5 w-5 text-amber-500" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="text-xs font-black text-slate-900 dark:text-white">{item.title}</p>
                                            <p className="text-[10px] font-bold text-slate-400 uppercase">{item.subtitle}</p>
                                        </div>
                                        <ArrowUpRight className="h-4 w-4 text-slate-300 group-hover/item:text-amber-500 transition-colors opacity-0 group-hover/item:opacity-100" />
                                    </div>
                                )) : (
                                    <div className="p-8 text-center">
                                        <p className="text-xs font-bold text-slate-400">No objects found</p>
                                    </div>
                                )}
                            </div>
                        ) : (
                            <div className="grid grid-cols-2 gap-2">
                                <Link href="/seller/products/add" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-amber-500 group transition-colors text-center">
                                    <p className="text-[10px] font-black text-slate-400 group-hover:text-white/60 uppercase">Action</p>
                                    <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-white mt-1">Add Product</p>
                                </Link>
                                <Link href="/seller/orders" className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl hover:bg-blue-500 group transition-colors text-center">
                                    <p className="text-[10px] font-black text-slate-400 group-hover:text-white/60 uppercase">Stats</p>
                                    <p className="text-xs font-black text-slate-900 dark:text-white group-hover:text-white mt-1">Orders</p>
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>

      <div className="flex items-center gap-2 md:gap-5 shrink-0">
        <div className="flex items-center gap-1 md:gap-1.5 bg-slate-50/50 dark:bg-slate-800/50 p-1 md:p-1.5 rounded-[1.25rem] border border-white dark:border-slate-800 backdrop-blur-md">
            {/* Search Trigger for mobile/tablet */}
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 text-slate-500 lg:hidden rounded-xl">
                        <Search className="h-5 w-5" />
                    </Button>
                </SheetTrigger>
                <SheetContent side="top" className="h-full sm:h-auto border-b-0 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl p-6">
                    <div className="flex flex-col gap-6 pt-8">
                        <div className="flex flex-col gap-1">
                            <h2 className="text-2xl font-black italic">Command Search</h2>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Global Node Interface</p>
                        </div>
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-amber-500" />
                            <Input 
                                autoFocus
                                placeholder="Type to search..." 
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-14 h-16 bg-slate-50 dark:bg-slate-800/50 border-none ring-2 ring-slate-100 dark:ring-slate-700/50 focus-visible:ring-amber-500 rounded-2xl text-lg font-bold"
                            />
                        </div>
                        <div className="space-y-4">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em]">Quick Results</p>
                            {searchQuery ? (
                                <div className="space-y-2">
                                    {mockSearchResults.map(item => (
                                        <div key={item.id} className="flex items-center gap-4 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl">
                                            <div className="h-12 w-12 bg-amber-500/10 rounded-xl flex items-center justify-center">
                                                <item.icon className="h-6 w-6 text-amber-500" />
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm font-black">{item.title}</p>
                                                <p className="text-[10px] font-bold text-slate-400 uppercase">{item.type}</p>
                                            </div>
                                        </div>
                                    ))}
                                    {mockSearchResults.length === 0 && (
                                        <p className="text-sm font-bold text-slate-400 text-center py-8">No results found</p>
                                    )}
                                </div>
                            ) : (
                                <div className="grid grid-cols-1 gap-2">
                                    <Link href="/seller/products/add" className="p-5 bg-amber-500 text-white rounded-2xl flex items-center justify-between group">
                                        <span className="font-black uppercase tracking-widest">Add New Product</span>
                                        <Sparkles className="h-5 w-5" />
                                    </Link>
                                    <Link href="/seller/orders" className="p-5 bg-slate-100 dark:bg-slate-800 rounded-2xl flex items-center justify-between">
                                        <span className="font-black uppercase tracking-widest text-slate-600 dark:text-slate-400">View All Orders</span>
                                        <ShoppingBag className="h-5 w-5 text-slate-400" />
                                    </Link>
                                </div>
                            )}
                        </div>
                    </div>
                </SheetContent>
            </Sheet>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <div className="relative group/bell">
                        <Button variant="ghost" size="icon" className="h-9 w-9 md:h-10 md:w-10 text-slate-500 dark:text-slate-400 hover:text-amber-500 hover:bg-white dark:hover:bg-slate-700 rounded-xl transition-all font-black">
                            <Bell className={cn("h-5 w-5", unreadCount > 0 && "animate-pulse")} />
                        </Button>
                        {unreadCount > 0 && (
                            <span className="absolute top-2 right-2 md:top-2.5 md:right-2.5 h-2 w-2 md:h-2.5 md:w-2.5 bg-amber-500 border-2 border-white dark:border-slate-800 rounded-full shadow-[0_0_12px_rgba(245,158,11,0.6)] group-hover/bell:scale-125 transition-transform" />
                        )}
                    </div>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-[calc(100vw-32px)] sm:w-[420px] mt-5 rounded-[2.5rem] p-0 border-slate-100 dark:border-slate-800 bg-white/95 dark:bg-slate-900/95 backdrop-blur-2xl shadow-2xl overflow-hidden" align="end">
                    <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-50 dark:border-slate-800/50">
                        <div>
                            <h4 className="text-sm md:text-base font-black italic tracking-tighter">Signal Matrix</h4>
                            <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Real-time Activity Hub</p>
                        </div>
                        <div className="flex items-center gap-2">
                            {unreadCount > 0 && (
                                <Button 
                                    onClick={(e) => { e.stopPropagation(); handleMarkAllRead(); }} 
                                    variant="ghost" 
                                    className="h-8 text-[10px] font-black text-amber-500 uppercase tracking-widest hover:bg-amber-500/5 px-3 rounded-full"
                                >
                                    Clear All
                                </Button>
                            )}
                            <Badge variant="outline" className="text-[10px] font-black uppercase px-3 py-1 rounded-full border-amber-500/20 bg-amber-500/5 text-amber-600">
                                {unreadCount} Priority
                            </Badge>
                        </div>
                    </div>
                    
                    <div className="max-h-[70vh] overflow-y-auto scrollbar-hide py-2">
                        {notifications.length > 0 ? (
                            <div className="px-2 space-y-1">
                                {notifications.map((n) => {
                                    const styles = getNotificationStyles(n.type);
                                    return (
                                        <DropdownMenuItem 
                                            key={n.id} 
                                            onClick={() => handleMarkAsRead(n.id)}
                                            className={cn(
                                                "rounded-3xl p-4 flex gap-4 cursor-pointer focus:bg-slate-50 dark:focus:bg-slate-800/50 group transition-all border-2 border-transparent relative overflow-hidden",
                                                !n.read && "bg-slate-50/50 dark:bg-slate-800/20 border-slate-100 dark:border-slate-800/50"
                                            )}
                                        >
                                            {!n.read && (
                                                <div className="absolute top-0 bottom-0 left-0 w-1 bg-amber-500" />
                                            )}
                                            <div className={cn("h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 transition-all group-hover:rotate-6 group-hover:scale-110 shadow-sm", styles.color)}>
                                                <styles.icon className="h-6 w-6" />
                                            </div>
                                            <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                                                <div className="flex items-center justify-between gap-2">
                                                    <p className={cn("text-sm font-black text-slate-900 dark:text-white truncate transition-colors", !n.read ? "text-slate-950 dark:text-white" : "text-slate-500 dark:text-slate-400")}>
                                                        {n.title}
                                                    </p>
                                                    <span className="text-[9px] font-bold text-slate-400 uppercase shrink-0">{n.time}</span>
                                                </div>
                                                <p className="text-[11px] font-medium text-slate-500 dark:text-slate-400 line-clamp-2 leading-snug">
                                                    {n.description}
                                                </p>
                                                <div className="flex items-center gap-3 mt-2">
                                                    <div className="flex items-center gap-1.5 grayscale group-hover:grayscale-0 transition-all opacity-60 group-hover:opacity-100">
                                                        <span className={cn(
                                                            "h-1.5 w-1.5 rounded-full",
                                                            n.priority === 'high' ? 'bg-rose-500' : n.priority === 'medium' ? 'bg-amber-500' : 'bg-slate-300'
                                                        )} />
                                                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400">{n.priority} focus</span>
                                                    </div>
                                                    <div className="h-3 w-px bg-slate-100 dark:bg-slate-800" />
                                                    <p className="text-[9px] font-black uppercase text-slate-400">Node Secure</p>
                                                </div>
                                            </div>
                                        </DropdownMenuItem>
                                    );
                                })}
                            </div>
                        ) : (
                            <div className="p-12 text-center flex flex-col items-center gap-4 animate-in fade-in zoom-in duration-500">
                                <div className="h-20 w-20 bg-slate-50 dark:bg-slate-800/50 rounded-[2.5rem] flex items-center justify-center border-2 border-dashed border-slate-200 dark:border-slate-700">
                                    <Zap className="h-8 w-8 text-slate-300 dark:text-slate-600 animate-pulse" />
                                </div>
                                <div>
                                    <p className="text-sm font-black text-slate-900 dark:text-white uppercase tracking-[0.2em]">System All Clear</p>
                                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">No new activity detected in your node</p>
                                </div>
                                <Button variant="outline" onClick={() => window.location.reload()} className="h-10 px-8 rounded-2xl border-slate-200 dark:border-slate-700 font-black text-[10px] uppercase tracking-widest hover:bg-amber-500 hover:text-white hover:border-amber-500 transition-all">
                                    Refresh Pulse
                                </Button>
                            </div>
                        )}
                    </div>
                    
                    {notifications.length > 0 && (
                        <div className="p-4 border-t border-slate-50 dark:border-slate-800/50">
                            <Button variant="ghost" className="w-full h-14 text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 hover:text-amber-500 transition-all flex items-center gap-3 group/btn">
                                Access Full Archive 
                                <ArrowUpRight className="h-4 w-4 group-hover/btn:translate-x-0.5 group-hover/btn:-translate-y-0.5 transition-transform" />
                            </Button>
                        </div>
                    )}
                </DropdownMenuContent>
            </DropdownMenu>

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
      </div>
      </div>
      
      {/* Row 2: Breadcrumbs - Dedicated Line */}
      <div className="w-full mt-2 hidden sm:flex items-center gap-2 overflow-hidden animate-in fade-in slide-in-from-top-1 duration-500">
          <div className="flex items-center gap-1 text-slate-400 dark:text-slate-500 font-black text-[9px] uppercase tracking-[0.2em] shrink-0">
             <span className="text-amber-500">●</span>
             <span>Path</span>
          </div>
          <div className="h-px w-8 bg-slate-200 dark:bg-slate-800 shrink-0" />
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide mask-fade-right">
            {breadcrumbs.map((bc, i) => (
                <div key={bc.href} className="flex items-center gap-2 shrink-0 group">
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
    </div>
  );
}
