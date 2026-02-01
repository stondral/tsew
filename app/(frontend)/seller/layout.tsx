import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { Sidebar } from "@/components/seller/Sidebar";
import { TopNav } from "@/components/seller/TopNav";
import Footer from "@/components/footer";
import { redirect } from "next/navigation";

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
    <div className="flex min-h-screen bg-[#F8FAFC]">
      <Sidebar user={user} className="hidden lg:block shadow-2xl z-50" />
      <div className="flex-1 flex flex-col min-w-0">
        <TopNav user={user} />
        <main className="flex-1 p-6 md:p-10 overflow-y-auto overflow-x-hidden relative z-10">
          <div className="max-w-[1600px] mx-auto min-h-[calc(100vh-200px)]">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </div>
  );
}
