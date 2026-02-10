import { getServerSideUser } from "@/lib/auth";
import { Sidebar } from "@/components/seller/Sidebar";
import { TopNav } from "@/components/seller/TopNav";
import Footer from "@/components/footer";
import { redirect } from "next/navigation";
import { ThemeProvider } from "@/components/ThemeProvider";

export const dynamic = 'force-dynamic';

export default async function SellerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getServerSideUser();

  // Authentication check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin" && (user as any).role !== "sellerEmployee")) {
    redirect("/auth?redirect=/seller/dashboard");
  }

  return (
    <ThemeProvider>
      <div className="flex h-screen overflow-hidden bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
        <Sidebar user={user} className="hidden lg:block shadow-2xl z-50 h-full shrink-0" />
        <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
          <TopNav user={user} />
          <main className="flex-1 overflow-y-auto overflow-x-hidden relative transition-all duration-300 custom-scrollbar">
            <div className="p-4 md:p-14 max-w-full mx-auto min-h-[calc(100vh-200px)]">
              {children}
            </div>
            <Footer />
          </main>
        </div>
      </div>
    </ThemeProvider>
  );
}
