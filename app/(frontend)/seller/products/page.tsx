import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { Button } from "@/components/ui/button";

export const dynamic = 'force-dynamic';
import { 
  Plus, 
  Search, 
  Filter, 
  Package
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { redirect } from "next/navigation";
import Link from "next/link";

import { ProductCard } from "@/components/seller/ProductCard";

export default async function SellerProductsPage() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || ((user as any).role !== "seller" && (user as any).role !== "admin")) {
    redirect("/login?redirect=/seller/products");
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsRes = await (payload as any).find({
    collection: "products",
    where: {
      seller: { equals: user.id },
    },
    sort: "-createdAt",
    limit: 100,
  });

  const products = productsRes.docs;

  return (
    <div className="space-y-12">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">Inventory Management</h1>
          <p className="text-slate-500 font-bold text-sm uppercase tracking-widest">You have <span className="text-amber-600">{products.length} Products</span> listed in your catalog</p>
        </div>
        <Link href="/seller/products/add">
          <Button className="font-black text-xs uppercase tracking-widest gap-2 rounded-2xl h-12 px-8 bg-amber-500 hover:bg-amber-600 text-white shadow-xl shadow-amber-500/20 border-none transition-all hover:scale-105 active:scale-95">
              <Plus className="h-4 w-4" /> Add New Product
          </Button>
        </Link>
      </div>

      <div className="bg-white/40 backdrop-blur-md rounded-[2.5rem] p-10 shadow-2xl shadow-slate-200/50 border border-white/20">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-10">
              <div className="relative w-full md:w-[450px] group">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400 group-focus-within:text-amber-500 transition-colors" />
                  <Input 
                      placeholder="Search by name, SKU or slug..." 
                      className="h-12 pl-12 bg-white border-none ring-1 ring-slate-100 focus-visible:ring-amber-500/50 rounded-2xl font-bold text-sm shadow-inner"
                  />
              </div>
              <div className="flex items-center gap-4 w-full md:w-auto">
                  <Button variant="outline" className="font-black text-xs uppercase tracking-widest h-12 px-6 rounded-2xl border-slate-100 hover:bg-white shadow-sm">
                      <Filter className="h-4 w-4 mr-2" /> Collection
                  </Button>
                  <Button variant="outline" className="font-black text-xs uppercase tracking-widest h-12 px-6 rounded-2xl border-slate-100 hover:bg-white shadow-sm">
                      Sort: Newest
                  </Button>
              </div>
          </div>

          {products.length === 0 ? (
              <div className="py-32 text-center rounded-[2rem] border-2 border-dashed border-slate-100">
                  <div className="flex flex-col items-center justify-center space-y-4">
                      <div className="p-6 bg-amber-50 rounded-3xl text-amber-500">
                          <Package className="h-12 w-12" />
                      </div>
                      <h3 className="text-2xl font-black text-slate-900">Virtual Shelf Empty</h3>
                      <p className="text-slate-400 font-bold max-w-xs mx-auto">Start your selling journey by listing your first masterpiece today.</p>
                      <Link href="/seller/products/add" className="mt-4">
                          <Button className="bg-slate-900 text-white hover:bg-black font-black text-xs uppercase tracking-widest px-8 h-12 rounded-2xl border-none">
                              Create First Product
                          </Button>
                      </Link>
                  </div>
              </div>
          ) : (
              <div className="grid gap-10 grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
                  {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
                  {products.map((product: any) => (
                      <ProductCard key={product.id} product={product} />
                  ))}
              </div>
          )}
      </div>
    </div>
  );
}
