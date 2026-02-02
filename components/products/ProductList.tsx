// components/products/ProductList.tsx
import { getPayload } from "payload";
import config from "@/payload.config";
import ProductsGrid from "./ProductsGrid";
import { resolveMediaUrl } from "@/lib/media";
import Link from "next/link";

interface Props {
  q?: string;
  category?: string;
  minPrice?: string;
  maxPrice?: string;
  sort?: string;
  view?: "grid" | "list";
}

export default async function ProductList({ q, category, minPrice, maxPrice, sort, view }: Props) {
  const payload = await getPayload({ config });

  // 1. Build the query
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

  // Fetch products
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
    description: p.description,
    price: (p.price && p.price > 0) ? p.price : p.basePrice,
    basePrice: p.basePrice,
    compareAtPrice: p.compareAtPrice,
    isActive: p.isActive,
    featured: p.featured,
    stock: p.stock,
    popularity: p.popularity,
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

  if (products.length === 0) {
    return (
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
    );
  }

  return <ProductsGrid products={products} view={view} />;
}
