"use client";

import { usePathname } from "next/navigation";
import Navbar from "@/components/navbar";
import Footer from "@/components/footer";

export default function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  // Check if the current route is under /seller
  const isAppPage = pathname?.startsWith("/seller") || pathname?.startsWith("/administrator");

  return (
    <>
      {!isAppPage && <Navbar />}
      <main className="flex-1 relative z-10">{children}</main>
      {!isAppPage && <Footer />}
    </>
  );
}
