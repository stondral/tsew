import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { AddProductFormMultiStep } from "@/components/seller/AddProductFormMultiStep";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = 'force-dynamic';

export default async function AddProductPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
    redirect("/login?redirect=/seller/products/add");
  }

  // Fetch categories for the form
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriesRes = await (payload as any).find({
    collection: "categories",
    limit: 100,
  });

  // Subscription Check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isActive = (user as any).subscriptionStatus === "active";

  if (!isActive) {
    return (
      <div className="space-y-12 min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
        <div className="max-w-md w-full p-8 bg-white rounded-3xl shadow-2xl border border-slate-100">
           <div className="h-20 w-20 bg-amber-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <Zap className="h-10 w-10 text-amber-500" />
           </div>
           <h2 className="text-3xl font-black text-slate-900 mb-4">Subscription Required</h2>
           <p className="text-slate-500 mb-8 font-medium">To keep our marketplace high-quality, product listing is reserved for our active partners. Upgrade your plan to start selling today!</p>
           
           <Link href="/seller/manage-plan">
              <Button className="w-full h-14 bg-amber-500 hover:bg-amber-600 text-white rounded-2xl font-bold text-lg shadow-lg shadow-amber-200 active:scale-95 transition-all">
                Upgrade Plan Now
              </Button>
           </Link>
           
           <Link href="/seller/products" className="block mt-6 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors">
              Back to Products
           </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-6 mb-12">
        <Link href="/seller/products">
          <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 bg-white shadow-xl ring-1 ring-slate-100 hover:bg-slate-50 transition-all">
            <ArrowLeft className="h-6 w-6 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">List New Product</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Submit your masterpiece to the marketplace</p>
        </div>
      </div>

      <AddProductFormMultiStep categories={categoriesRes.docs} />
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Zap(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M4 14.7l10-10.7v6.6h6L10 21.3v-6.6H4z" />
    </svg>
  );
}
