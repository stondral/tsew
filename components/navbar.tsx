"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import AuthDropdown from "@/components/auth/AuthDropdown";
import Cart from "@/components/cart/Cart";
import logoston from "./logoston.png";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Discover" },
  { href: "/about-us", label: " Our Story" },
  { href: "/feedback", label: "Feedback" },
  { href: "/about-us", label: "About Us" },
];

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isScrolled, setIsScrolled] = useState(false);
  const isFeedbackPage = pathname === "/feedback";

  useEffect(() => {
    if (!isFeedbackPage) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isFeedbackPage]);

  return (
    <nav className={`sticky top-4 z-50 w-[95%] max-w-7xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition-all duration-300 ${
      isFeedbackPage && isScrolled ? "opacity-0 pointer-events-none -translate-y-full" : "opacity-100"
    }`}>
      <div className="container flex h-16 items-center px-4 md:px-8 relative">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/10 via-transparent to-accent/10 pointer-events-none opacity-50" />

        {/* mobile menu */}
        <Sheet>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden z-10">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left">
            <nav className="flex flex-col gap-4 mt-8">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const q = formData.get("q");
                  if (q)
                    router.push(
                      `/products?q=${encodeURIComponent(q.toString())}`,
                    );
                }}
                className="relative w-full mb-4"
              ></form>
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-lg font-medium transition-colors ${
                    isActive(link.href, pathname)
                      ? "text-foreground font-semibold"
                      : "text-foreground/60 hover:text-accent"
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* logo */}
        <Link href="/" className="mr-6 flex items-center gap-2 z-10">
          <Image
            src={logoston}
            alt="Stond Emporium Logo"
            width={64}
            height={64}
            className="rounded-lg"
          />
          <span className="hidden sm:inline text-xl font-bold tracking-tight">
            Stond Emporium
          </span>
        </Link>

        {/* desktop nav */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium z-10">
          {NAV_LINKS.slice(0, 4).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors ${
                isActive(link.href, pathname)
                  ? "text-foreground font-semibold"
                  : "text-foreground/60 hover:text-accent"
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* right actions */}
        <div className="flex flex-1 items-center justify-end gap-4 z-10">
          <div className="hidden md:flex relative max-w-[280px] w-full items-center">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const q = formData.get("q");
                if (q)
                  router.push(
                    `/products?q=${encodeURIComponent(q.toString())}`,
                  );
              }}
              className="relative w-full flex items-center pt-3"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-9 w-5 text-muted-foreground z-10 pt-3" />

              <Input
                name="q"
                type="search"
                placeholder="Search products..."
                className="h-9 pl-10 bg-card border-transparent focus-visible:ring-accent"
              />
            </form>
          </div>

          <Cart />
          <AuthDropdown />
        </div>
      </div>
    </nav>
  );
}

function isActive(href: string, pathname: string) {
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
