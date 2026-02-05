"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  ShoppingBag,

  ChevronDown,
  TrendingUp,
  CreditCard,
  ChevronLeft,
  ChevronRight,
  Zap,
  ArrowLeft,
  HelpCircle,
  Warehouse,
  Users,
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
    title: "Incoming Orders",
    icon: Zap,
    href: "/seller/orders/incoming",
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
  {
    title: "Warehouses",
    icon: Warehouse,
    href: "/seller/warehouses",
  },
  {
    title: "Teams",
    icon: Users,
    href: "/seller/team",
  },
];

export function Sidebar({ className, user }: SidebarProps) {
  usePathname();
  const [openMenus, setOpenMenus] = useState<string[]>(["Products"]);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [width, setWidth] = useState(300);
  const isResizing = useRef(false);

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

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isResizing.current) return;
      const newWidth = Math.min(Math.max(e.clientX, 80), 480);

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
    },
    [isCollapsed]
  );

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", stopResizing);
    document.body.style.cursor = "default";
  }, [handleMouseMove]);

  const startResizing = useCallback(() => {
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
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : [...prev, title]
    );
  };

  const actualWidth = isCollapsed ? 80 : width;

  return (
    <div
      className={cn(
        "bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-400 h-screen flex flex-col border-r border-slate-100 dark:border-slate-800 relative overflow-hidden",
        className
      )}
      style={{
        width: `${actualWidth}px`,
        height: "100vh",
        transition: isResizing.current ? "none" : "width 0.3s ease-in-out",
      }}
    >
      {/* Resizer */}
      {!isCollapsed && (
        <div
          onMouseDown={startResizing}
          className="absolute right-0 top-0 w-1 h-full cursor-col-resize hover:bg-amber-500/30 z-50"
        />
      )}

      {/* Collapse button */}
      <button
        onClick={toggleCollapse}
        className="absolute -right-3 top-8 h-6 w-6 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center text-slate-400 hover:text-amber-500 z-50"
      >
        {isCollapsed ? (
          <ChevronRight className="h-3 w-3" />
        ) : (
          <ChevronLeft className="h-3 w-3" />
        )}
      </button>

      {/* Header */}
      <div
        className={cn(
          "h-24 px-8 flex items-center gap-3 border-b shrink-0",
          isCollapsed && "px-4 justify-center"
        )}
      >
        <div className="h-10 w-10 bg-amber-500 rounded-2xl flex items-center justify-center">
          <Image src={logoston} alt="Logo" width={26} height={26} />
        </div>
        {!isCollapsed && (
          <div>
            <span className="text-lg font-black text-slate-900 dark:text-white">
              Stond <span className="text-amber-500">Emporium</span>
            </span>
            <Link href="/" className="flex items-center gap-1 text-xs mt-1">
              <ArrowLeft className="h-3 w-3 text-amber-500" />
              Back to Store
            </Link>
          </div>
        )}
      </div>

      {/* ✅ SCROLLABLE SECTION */}
      <div className="flex-1 overflow-y-auto overscroll-contain custom-scrollbar overflow-x-hidden">
        <div className="px-5 py-6 space-y-6">
          <div>
            <h2 className={cn("mb-4 px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-slate-500", isCollapsed && "hidden")}>
              Main Menu
            </h2>

            {sidebarLinks.map((link) => (
              <div key={link.title}>
                {link.children ? (
                  <>
                    <button
                      onClick={() => toggleMenu(link.title)}
                      className={cn(
                        "w-full flex items-center px-4 py-3 rounded-xl font-bold text-sm",
                        isCollapsed ? "justify-center" : "justify-between"
                      )}
                    >
                      <div className="flex items-center gap-3">
                        <link.icon className="h-5 w-5" />
                        {!isCollapsed && link.title}
                      </div>
                      {!isCollapsed && (
                        <ChevronDown
                          className={cn(
                            "h-4 w-4 transition-transform",
                            openMenus.includes(link.title) && "rotate-180"
                          )}
                        />
                      )}
                    </button>

                    {!isCollapsed &&
                      openMenus.includes(link.title) &&
                      link.children.map((child) => (
                        <Link key={child.href} href={child.href}>
                          <div className="ml-11 px-4 py-2 rounded-lg text-sm font-bold hover:bg-slate-100 dark:hover:bg-slate-800">
                            {child.title}
                          </div>
                        </Link>
                      ))}
                  </>
                ) : (
                  <Link href={link.href}>
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                      <link.icon className="h-5 w-5" />
                      {!isCollapsed && link.title}
                    </div>
                  </Link>
                )}
              </div>
            ))}
          </div>

          <div className="pt-4 border-t">
            <Link href="/seller/support">
              <div className="flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-sm hover:bg-slate-100 dark:hover:bg-slate-800">
                <HelpCircle className="h-5 w-5" />
                {!isCollapsed && "Get Support"}
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* Footer */}
      {!isCollapsed && user && (
        <div className="p-4 border-t shrink-0 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black">
            {user.username?.[0] || user.email?.[0]}
          </div>
          <div>
            <p className="font-black">{user.username || "Seller"}</p>
            <p className="text-xs uppercase">{user.role}</p>
          </div>
        </div>
      )}
    </div>
  );
}
