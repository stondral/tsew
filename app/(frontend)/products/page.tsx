// app/(frontend)/products/page.tsx
import { getPayload } from "payload";
import config from "@/payload.config";
import ProductsGrid from "@/components/products/ProductsGrid";
import { resolveMediaUrl } from "@/lib/media";
import ProductFilters from "@/components/products/ProductFilters";
import ProductSort from "@/components/products/ProductSort";
import Link from "next/link";

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ 
    q?: string;
    category?: string;
    minPrice?: string;
    maxPrice?: string;
    sort?: string;
    view?: "grid" | "list";
  }>;
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, category, minPrice, maxPrice, sort, view } = await searchParams;
  const payload = await getPayload({ config });

  // 1. Fetch categories for filters
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriesRes = await (payload as any).find({
    collection: "categories",
    limit: 100,
  });

  // 2. Build the query
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const whereQuery: any = {
    status: { equals: "live" },
    isActive: { equals: true },
  };

  // Search query
  if (q) {
    whereQuery.or = [
      { name: { contains: q } },
      { description: { contains: q } },
      { slug: { contains: q } },
    ];
  }

  // Category filter
  if (category) {
    whereQuery.category = { equals: category };
  }

  // Price range filter
  if (minPrice || maxPrice) {
    whereQuery.basePrice = {};
    if (minPrice) whereQuery.basePrice.greater_than_equal = parseFloat(minPrice);
    if (maxPrice) whereQuery.basePrice.less_than_equal = parseFloat(maxPrice);
  }

  // Sorting
  let sortOption = "-createdAt";
  if (sort === "price-asc") sortOption = "basePrice";
  if (sort === "price-desc") sortOption = "-basePrice";
  if (sort === "newest") sortOption = "-createdAt";

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const productsRes = await (payload as any).find({
    collection: "products",
    where: whereQuery,
    sort: sortOption,
    limit: 50,
    depth: 2,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const products = productsRes.docs.map((p: any) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    price: (p.price && p.price > 0) ? p.price : p.basePrice,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    isActive: p.isActive,
    featured: p.featured,
    stock: p.stock,
    category: {
      id: typeof p.category === "object" ? p.category?.id : p.category,
      name: typeof p.category === "object" ? p.category?.name : "Uncategorized",
    },
    images: Array.isArray(p.media)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? p.media.map((m: any) => resolveMediaUrl(m))
      : p.media
      ? [resolveMediaUrl(p.media)]
      : [],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    variants: (p.variants || p.productVariants)?.map((v: any) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      image: v.image ? resolveMediaUrl(v.image) : undefined,
      attributes: v.attributes ?? [],
    })) ?? [],
  }));

  return (
    <div className="min-h-screen bg-[#F8F9FA] py-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-10">
          <div className="flex items-start gap-4">
            <Link 
              href="/" 
              className="mt-1 p-2 bg-white rounded-xl border border-gray-200 text-gray-400 hover:text-orange-600 hover:border-orange-200 transition-all shadow-sm"
              title="Back to Home"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </Link>
            <div>
            <h1 className="text-4xl font-black text-gray-900 tracking-tight">
              {q ? (
                <>
                  Results for <span className="text-orange-600 underline decoration-orange-200 underline-offset-8">&quot;{q}&quot;</span>
                </>
              ) : (
                "Explore Gallery"
              )}
            </h1>
            <p className="text-gray-500 mt-3 font-medium">
              Found {products.length} {products.length === 1 ? "masterpiece" : "products"} for you
            </p>
            </div>
          </div>
          
          <ProductSort currentSort={sort || "newest"} />
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters */}
          <aside className="w-full lg:w-72 shrink-0">
            <div className="sticky top-24">
              <ProductFilters 
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
                categories={categoriesRes.docs.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))}
                currentCategory={category}
                currentMinPrice={minPrice}
                currentMaxPrice={maxPrice}
              />
            </div>
          </aside>

          {/* Main Grid */}
          <main className="flex-1">
            {products.length === 0 ? (
              <div className="bg-white rounded-[2rem] p-16 text-center border border-gray-100 shadow-xl shadow-gray-200/50">
                <div className="bg-orange-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-8 border-4 border-white shadow-lg">
                  <svg className="w-12 h-12 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
                <h2 className="text-3xl font-extrabold text-gray-900 mb-3">No matches found</h2>
                <p className="text-gray-500 max-w-sm mx-auto mb-10 text-lg leading-relaxed">
                  The masterpiece you&apos;re looking for might be in another gallery. Try refining your filters.
                </p>
                <Link 
                  href="/products" 
                  className="inline-flex items-center justify-center px-10 py-5 bg-orange-600 hover:bg-orange-700 text-white font-black rounded-2xl transition-all shadow-xl shadow-orange-200 hover:scale-[1.02] active:scale-[0.98]"
                >
                  Clear All Filters
                </Link>
              </div>
            ) : (
              <ProductsGrid products={products} view={view || "grid"} />
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
