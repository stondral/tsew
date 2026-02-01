import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { EditProductForm } from "@/components/seller/EditProductForm";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
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
  if (!user || (userRole !== "seller" && userRole !== "admin")) {
    redirect(`/login?redirect=/seller/products/edit/${id}`);
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

  // Security check: only the owner or an admin can edit
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (((user as any).role !== "admin") && ((product as any).seller as any).id !== user.id && (product as any).seller !== user.id) {
    redirect("/seller/products");
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

      <EditProductForm product={product} categories={categoriesRes.docs} />
    </div>
  );
}
