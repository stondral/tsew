"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if the current route is under /seller
  const isSellerPage = pathname?.startsWith("/seller");

  return (
    <>
      {!isSellerPage && <Navbar />}
      <main className="flex-1 relative z-10">{children}</main>
      {!isSellerPage && <Footer />}
    </>
  );
}
