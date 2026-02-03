import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
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
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // Authentication check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
    redirect("/login?redirect=/seller/dashboard");
  }

  return (
    <ThemeProvider>
      <div className="flex min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-300">
        <Sidebar user={user} className="hidden lg:block shadow-2xl z-50 sticky top-0 h-screen" />
        <div className="flex-1 flex flex-col min-w-0">
          <TopNav user={user} />
          <main className="flex-1 p-4 md:p-14 overflow-y-auto overflow-x-hidden relative z-10 transition-all duration-300">
            <div className="max-w-full mx-auto min-h-[calc(100vh-200px)]">
              {children}
            </div>
          </main>
          <Footer />
        </div>
      </div>
    </ThemeProvider>
  );
}
