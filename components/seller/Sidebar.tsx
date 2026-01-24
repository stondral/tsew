"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";

import { 
  LayoutDashboard, 
  ShoppingBag, 
  Settings, 
  ChevronDown,
  TrendingUp,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowLeft,
  HelpCircle
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Image from "next/image";
import logoston from "@/components/logoston.png";

interface SidebarProps extends React.HTMLAttributes<HTMLDivElement> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  user?: any;
}

const sidebarLinks = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/seller/dashboard",
  },
  {
    title: "Products",
    icon: ShoppingBag,
    href: "/seller/products",
    children: [
      { title: "Inventory", href: "/seller/products" },
      { title: "Add New", href: "/seller/products/add" },
    ],
  },
  {
    title: "Orders",
    icon: CreditCard,
    href: "/seller/orders",
  },
  {
    title: "Analytics",
    icon: TrendingUp,
    href: "/seller/analytics",
  },
  {
    title: "Manage Plan",
    icon: Zap,
    href: "/seller/manage-plan",
  },
];

export function Sidebar({ className, user }: SidebarProps) {
  const pathname = usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>(["Products"]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(300);
  const isResizing = useRef(false);

  // Load preferences from localStorage
  useEffect(() => {
    const savedWidth = localStorage.getItem("sidebarWidth");
    const savedCollapsed = localStorage.getItem("sidebarCollapsed");
    if (savedWidth) setWidth(parseInt(savedWidth));
    if (savedCollapsed) setIsCollapsed(savedCollapsed === "true");
  }, []);

  const toggleCollapse = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    localStorage.setItem("sidebarCollapsed", String(newState));
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = Math.min(Math.max(e.clientX, 80), 480);
    // Auto-collapse if width becomes too small
    if (newWidth < 140) {
      if (!isCollapsed) {
        setIsCollapsed(true);
        localStorage.setItem("sidebarCollapsed", "true");
      }
    } else {
      if (isCollapsed) {
        setIsCollapsed(false);
        localStorage.setItem("sidebarCollapsed", "false");
      }
      setWidth(newWidth);
      localStorage.setItem("sidebarWidth", String(newWidth));
    }
  }, [isCollapsed]);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const startResizing = useCallback((// eslint-disable-next-line @typescript-eslint/no-unused-vars
  _e: React.MouseEvent) => {
    isResizing.current = true;
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", stopResizing);
    document.body.style.cursor = "col-resize";
  }, [handleMouseMove, stopResizing]);

  const toggleMenu = (title: string) => {
    if (isCollapsed) {
      setIsCollapsed(false);
      localStorage.setItem("sidebarCollapsed", "false");
    }
    setOpenMenus((prev) =>
      prev.includes(title) ? prev.filter((t) => t !== title) : [...prev, title]
    );
  };

  const actualWidth = isCollapsed ? 80 : width;

  return (
    <div 
      className={cn("bg-white text-slate-600 h-240 sticky top-0 flex flex-col border-r border-slate-100 group/sidebar relative z-[100]", className)}
      style={{ width: `${actualWidth}px`, transition: isResizing.current ? 'none' : 'width 0.3s ease-in-out' }}
    >
      {/* Resizer Handle */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-amber-500/30 transition-colors z-50 group-hover/sidebar:opacity-100 opacity-0"
        />
      )}

      {/* Collapse Toggle Button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-8 h-6 w-6 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-400 hover:text-amber-500 hover:border-amber-500 shadow-sm transition-all z-[60] opacity-0 group-hover/sidebar:opacity-100"
      >
        {isCollapsed ? <ChevronRight className="h-3 w-3" /> : <ChevronLeft className="h-3 w-3" />}
      </button>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className={cn(
          "h-24 px-8 flex items-center gap-3 transition-all border-b border-slate-50 relative", 
          isCollapsed && "px-4 justify-center"
        )}>
          <div className="h-10 w-10 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 shrink-0">
             <Image src={logoston} alt="Logo" width={26} height={26} />
          </div>
          {!isCollapsed && (
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-tight text-slate-900 truncate leading-none">Stond <span className="text-amber-500">Emporium</span></span>
              <Link href="/" className="mt-1.5 flex items-center gap-1 group/back">
                <ArrowLeft className="h-3 w-3 text-amber-500 transition-transform group-hover/back:-translate-x-0.5" />
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest hover:text-amber-500 transition-colors">Back to Store</span>
              </Link>
            </div>
          )}
        </div>
        
        <div className="px-5 space-y-6 flex-1 overflow-y-auto scrollbar-hide mt-6">
          <div className={isCollapsed ? "flex flex-col items-center" : ""}>
            <h2 className={cn("mb-4 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase", isCollapsed && "hidden")}>
              Main Menu
            </h2>
            <div className="space-y-2 w-full">
              {sidebarLinks.map((link) => (
                <div key={link.title}>
                  {link.children ? (
                    <>
                      <button
                        onClick={() => toggleMenu(link.title)}
                        title={isCollapsed ? link.title : undefined}
                        className={cn(
                          "w-full flex items-center px-4 py-4 rounded-xl transition-all group font-bold text-sm",
                          isCollapsed ? "justify-center px-0" : "justify-between",
                          pathname.startsWith(link.href) 
                            ? "bg-slate-100 text-slate-900" 
                            : "hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                        )}
                      >
                        <div className="flex items-center gap-3">
                          <link.icon className={cn(
                            "h-5 w-5 transition-colors shrink-0",
                            pathname.startsWith(link.href) ? "text-amber-500" : "text-slate-400 group-hover:text-amber-500"
                          )} />
                          {!isCollapsed && <span>{link.title}</span>}
                        </div>
                        {!isCollapsed && (
                          <ChevronDown
                            className={cn(
                              "h-4 w-4 transition-transform duration-300 text-slate-400",
                              openMenus.includes(link.title) && "rotate-180"
                            )}
                          />
                        )}
                      </button>
                      
                      {!isCollapsed && (
                        <div className={cn(
                          "mt-1 space-y-1 overflow-hidden transition-all duration-300",
                          openMenus.includes(link.title) ? "max-h-40 opacity-100" : "max-h-0 opacity-0"
                        )}>
                          {link.children.map((child) => (
                            <Link key={child.href} href={child.href}>
                              <div
                                className={cn(
                                  "flex items-center gap-3 ml-11 px-4 py-2 text-sm font-semibold rounded-lg transition-colors mb-1",
                                  pathname === child.href
                                    ? "text-amber-600 bg-amber-50"
                                    : "text-slate-500 hover:text-slate-900 hover:bg-slate-50"
                                )}
                              >
                                <div className={cn(
                                  "h-1.5 w-1.5 rounded-full transition-colors",
                                  pathname === child.href ? "bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]" : "bg-slate-200"
                                )} />
                                {child.title}
                              </div>
                            </Link>
                          ))}
                        </div>
                      )}
                    </>
                  ) : (
                    <Link href={link.href} title={isCollapsed ? link.title : undefined}>
                      <div
                        className={cn(
                          "flex items-center px-4 py-4 rounded-xl transition-all group font-bold text-sm",
                          isCollapsed ? "justify-center px-0" : "gap-3",
                          pathname === link.href 
                            ? "bg-slate-100 text-slate-900 shadow-sm" 
                            : "hover:bg-slate-50 text-slate-500 hover:text-slate-900"
                        )}
                      >
                        <link.icon className={cn(
                          "h-5 w-5 transition-colors shrink-0",
                          pathname === link.href ? "text-amber-500" : "text-slate-400 group-hover:text-amber-500"
                        )} />
                        {!isCollapsed && <span>{link.title}</span>}
                      </div>
                    </Link>
                  )}
                </div>
              ))}
            </div>
          </div>
          
          <div className={cn("pt-4 border-t border-slate-100", isCollapsed && "flex flex-col items-center")}>
            <h2 className={cn("mb-4 px-4 text-[10px] font-black tracking-[0.2em] text-slate-400 uppercase", isCollapsed && "hidden")}>
              Help & Marketplace
            </h2>
            <div className="space-y-2 w-full">
                <Link href="/seller/support" title={isCollapsed ? "Get Support" : undefined}>
                  <div className={cn("flex items-center rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-900 cursor-pointer font-bold text-sm transition-all py-4 px-4", isCollapsed ? "justify-center px-0" : "gap-3")}>
                      <HelpCircle className="h-5 w-5 text-slate-400 group-hover/sidebar:text-amber-500" />
                      {!isCollapsed && <span>Get Support</span>}
                  </div>
                </Link>
                <div 
                  title={isCollapsed ? "Settings" : undefined}
                  className={cn("flex items-center rounded-xl hover:bg-slate-50 text-slate-500 hover:text-slate-900 cursor-pointer font-bold text-sm transition-all py-3 px-4", isCollapsed ? "justify-center px-0" : "gap-3")}
                >
                    <Settings className="h-5 w-5 text-slate-400 group-hover:text-amber-500" />
                    {!isCollapsed && <span>Settings</span>}
                </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Bottom Profile Info (Optional but adds grounded feeling) */}
      {!isCollapsed && user && (
        <div className="p-4 bg-slate-50/50 mt-auto border-t border-slate-100 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500 flex items-center justify-center text-white font-black text-sm shadow-md">
            {user.username?.[0] || user.email[0]}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-black text-slate-900 truncate">{user.username || "Seller"}</p>
            <p className="text-[10px] font-bold text-slate-400 truncate uppercase tracking-tighter">{user.role}</p>
          </div>
        </div>
      )}
    </div>
  );
}
