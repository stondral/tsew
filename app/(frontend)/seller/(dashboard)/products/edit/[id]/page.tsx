import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { EditProductFormMultiStep } from "@/components/seller/EditProductFormMultiStep";
import { Button } from "@/components/ui/button";
import { ArrowLeft, ShieldAlert, Lock } from "lucide-react";
import Link from "next/link";
import { redirect, notFound } from "next/navigation";


export const dynamic = 'force-dynamic';

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any).role;
  if (!user || (userRole !== "seller" && userRole !== "admin" && userRole !== "sellerEmployee")) {
    redirect(`/auth?redirect=/seller/products/edit/${id}`);
  }

  // Fetch the product
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = await (payload as any).findByID({
    collection: "products",
    id,
  }).catch(() => null);

  if (!product) {
    notFound();
  }

  // Security check: only the owner, an authorized team member, or a global admin can edit
  const sellerId = typeof product.seller === 'string' ? product.seller : product.seller.id;
  const { hasPermission } = await import("@/lib/rbac/permissions");
  const canEdit = (userRole === "admin") || await hasPermission(payload, user.id, sellerId, 'product.edit');

  if (!canEdit) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="relative">
          <div className="h-24 w-24 bg-rose-100 rounded-[2rem] flex items-center justify-center transform -rotate-6 hover:rotate-0 transition-transform duration-500">
            <Lock className="h-10 w-10 text-rose-500" />
          </div>
          <div className="absolute -top-2 -right-2 h-8 w-8 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg border-2 border-white">
            <ShieldAlert className="h-4 w-4 text-white" />
          </div>
        </div>

        <div className="text-center space-y-4 max-w-sm">
          <h2 className="text-3xl font-black text-slate-900 tracking-tight">Access Restricted</h2>
          <p className="text-slate-500 font-bold leading-relaxed">
            You don&apos;t have sufficient permissions to edit this product. Please <span className="text-amber-600">contact your administrator</span> to upgrade your access level.
          </p>
        </div>

        <Link href="/seller/products">
          <Button variant="outline" className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest border-slate-200 hover:bg-slate-50 transition-all hover:scale-105 active:scale-95">
            Back to Inventory
          </Button>
        </Link>
      </div>
    );
  }

  // Fetch categories for the form
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriesRes = await (payload as any).find({
    collection: "categories",
    limit: 100,
  });

  return (
    <div className="space-y-12">
      <div className="flex items-center gap-6 mb-12">
        <Link href="/seller/products">
          <Button variant="ghost" size="icon" className="rounded-2xl h-14 w-14 bg-white shadow-xl ring-1 ring-slate-100 hover:bg-slate-50 transition-all">
            <ArrowLeft className="h-6 w-6 text-slate-600" />
          </Button>
        </Link>
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900">Edit Product</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest mt-1">Refine your masterpiece for the marketplace</p>
        </div>
      </div>

      <EditProductFormMultiStep product={product} categories={categoriesRes.docs} />
    </div>
  );
}
