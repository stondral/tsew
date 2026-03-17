"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Sheet, SheetContent, SheetTrigger, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { motion, AnimatePresence } from "framer-motion";
import AuthDropdown from "@/components/auth/AuthDropdown";
import Cart from "@/components/cart/Cart";
import VoiceSearchTrigger from "@/components/search/VoiceSearchTrigger";
import VoiceSearchOverlay from "@/components/search/VoiceSearchOverlay";

import logoston from "./logoston.png";

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Discover", badge: "NEW" },
  { href: "/wishlist", label: "Wishlist" },
  { href: "/about-us", label: "About Us" },
  { href: "/feedback", label: "Feedback", badge: "HOT" },
];

export default function Navbar() {
   const pathname = usePathname();
   const router = useRouter();
   const [isScrolled, setIsScrolled] = useState(false);
   const [isSearchVisible, setIsSearchVisible] = useState(false);
   const [isMenuOpen, setIsMenuOpen] = useState(false);
   const [isVoiceOverlayOpen, setIsVoiceOverlayOpen] = useState(false);
   const isImmersivePage = pathname === "/feedback" || pathname === "/meetus";

  useEffect(() => {
    if (!isImmersivePage) return;
    
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isImmersivePage]);

  return (
    <nav className={`sticky top-4 z-50 w-[95%] max-w-7xl mx-auto rounded-2xl border border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl shadow-[0_20px_50px_rgba(0,0,0,0.15)] ring-1 ring-black/5 transition-all duration-300 ${
      isImmersivePage && isScrolled ? "opacity-0 pointer-events-none -translate-y-full" : "opacity-100"
    }`}>
      <div className="container flex h-16 items-center px-4 md:px-8 relative overflow-hidden">
        <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-accent/10 via-transparent to-accent/10 pointer-events-none opacity-50" />

        {/* mobile menu */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="mr-2 md:hidden z-10 transition-transform active:scale-90">
              <Menu className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-[300px] border-r border-slate-100 bg-white px-0">
            <SheetTitle className="px-6 text-xl font-bold tracking-tight text-slate-900 mt-8 font-display" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              STOND <span className="text-orange-600">MENU</span>
            </SheetTitle>
            <SheetDescription className="px-6 text-slate-400 font-medium text-[10px] uppercase tracking-wider mt-1 mb-8 font-display" style={{ fontFamily: 'var(--font-display), sans-serif' }}>
              Premium Shopping Experience
            </SheetDescription>
            
            <nav className="flex flex-col px-4">
              <AnimatePresence>
                {isMenuOpen && (
                  <div className="space-y-1">
                    {NAV_LINKS.map((link, idx) => (
                      <motion.div
                        key={link.href}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: idx * 0.05, type: "spring", stiffness: 120 }}
                      >
                        <Link
                          href={link.href}
                          onClick={() => setIsMenuOpen(false)}
                          className={`group flex items-center justify-between px-6 py-3 rounded-xl transition-all font-display ${
                            isActive(link.href, pathname)
                              ? "bg-orange-50/50 text-orange-600"
                              : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                          }`}
                          style={{ fontFamily: 'var(--font-display), sans-serif' }}
                        >
                          <span className={`text-base font-semibold tracking-tight`}>
                            {link.label}
                          </span>
                          
                          {link.badge && (
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ring-1 ${
                              link.badge === 'NEW' 
                                ? "bg-orange-500 text-white ring-orange-500" 
                                : "bg-white text-orange-500 ring-orange-200"
                            }`}>
                              {link.badge}
                            </span>
                          )}
                        </Link>
                      </motion.div>
                    ))}
                  </div>
                )}
              </AnimatePresence>
            </nav>

            <div className="absolute bottom-8 left-0 w-full px-6">
              <div className="p-6 rounded-2xl bg-white border border-slate-100 shadow-sm">
                <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1 font-display" style={{ fontFamily: 'var(--font-display), sans-serif' }}>Partner with us</p>
                <h4 className="text-base font-bold mb-4 tracking-tight text-slate-900 font-display" style={{ fontFamily: 'var(--font-display), sans-serif' }}>Become a Stond Seller</h4>
                <Link href="/auth" onClick={() => setIsMenuOpen(false)}>
                  <Button className="w-full bg-slate-900 text-white hover:bg-slate-800 rounded-lg font-bold text-xs uppercase tracking-wider h-11 border-none shadow-sm">
                    Join Today
                  </Button>
                </Link>
              </div>
            </div>
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
          {NAV_LINKS.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors duration-200 pb-1 ${
                isActive(link.href, pathname)
                  ? "text-foreground font-semibold border-b-2 border-accent"
                  : "text-foreground/80 hover:text-foreground"
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
              className="relative w-full flex items-center"
            >
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground z-10" />

              <Input
                name="q"
                type="search"
                placeholder="Search products..."
                className="h-9 pl-10 pr-10 bg-card border-transparent focus-visible:ring-accent"
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center">
                <VoiceSearchTrigger onOpen={() => setIsVoiceOverlayOpen(true)} />
              </div>
            </form>
          </div>

          {/* Mobile Search Button */}
          <div className="md:hidden flex items-center">
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setIsSearchVisible(true)}
              className="text-foreground/60"
            >
              <Search className="h-5 w-5" />
            </Button>
          </div>

          <Cart />
          <AuthDropdown />
        </div>

        {/* Mobile Search Overlay */}
        <AnimatePresence>
          {isSearchVisible && (
            <motion.div
              initial={{ x: "100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="absolute inset-0 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-xl flex items-center px-4 gap-2 z-30"
            >
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  const q = formData.get("q");
                  if (q) {
                    router.push(`/products?q=${encodeURIComponent(q.toString())}`);
                    setIsSearchVisible(false);
                  }
                }}
                className="flex-1 flex items-center relative"
              >
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  name="q"
                  type="search"
                  autoFocus
                  placeholder="Search products..."
                  className="h-10 pl-10 pr-10 w-full bg-accent/50 border-none rounded-xl focus-visible:ring-1 focus-visible:ring-accent"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 z-30 flex items-center">
                  <VoiceSearchTrigger onOpen={() => setIsVoiceOverlayOpen(true)} />
                </div>
              </form>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => setIsSearchVisible(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                Cancel
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isVoiceOverlayOpen && (
            <VoiceSearchOverlay onClose={() => setIsVoiceOverlayOpen(false)} />
          )}
        </AnimatePresence>
      </div>
    </nav>
  );
}

function isActive(href: string, pathname: string | null) {
  if (!pathname) return false;
  if (href === "/") return pathname === "/";
  return pathname.startsWith(href);
}
