// app/(frontend)/products/page.tsx
import { getPayload } from "payload";
import config from "@/payload.config";
import ProductFilters from "@/components/products/ProductFilters";
import ProductSort from "@/components/products/ProductSort";
import ProductList from "@/components/products/ProductList";
import ProductSkeleton from "@/components/products/ProductSkeleton";
import Link from "next/link";
import { Suspense } from "react";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';

export async function generateMetadata({ searchParams }: PageProps): Promise<Metadata> {
  const { q, category } = await searchParams;
  
  let title = "Shop Premium Products Online in India | Stondemporium";
  let description = "Browse our extensive collection of premium products at Stondemporium. Fast delivery across India. Shop now!";
  let keywords = [
    "online shopping India",
    "buy products online",
    "premium products",
    "e-commerce India",
    "shop online",
    "Stondemporium"
  ];

  if (category) {
    title = `Buy ${category.charAt(0).toUpperCase() + category.slice(1)} Online in India | Stondemporium`;
    description = `Shop premium ${category} products online at Stondemporium. Best deals with fast shipping across India. Order now!`;
    keywords = [
      `buy ${category.toLowerCase()} online`,
      `${category.toLowerCase()} India`,
      `${category.toLowerCase()} online shopping`,
      `best ${category.toLowerCase()}`,
      `premium ${category.toLowerCase()}`,
      "online shopping India",
      "Stondemporium"
    ];
  }

  if (q) {
    title = `${q} - Search Results | Stondemporium`;
    description = `Find ${q} and more at Stondemporium. Premium products with fast delivery across India. Shop now!`;
    keywords = [
      q,
      `buy ${q.toLowerCase()} online`,
      `${q.toLowerCase()} India`,
      "online shopping",
      "Stondemporium"
    ];
  }

  return { 
    title, 
    description,
    keywords,
    alternates: {
      canonical: 'https://stondemporium.tech/products',
    },
    openGraph: {
      title,
      description,
      url: 'https://stondemporium.tech/products',
      siteName: 'Stondemporium',
      locale: 'en_IN',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
    },
  };
}

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

function ProductsGridSkeleton({ view }: { view?: "grid" | "list" }) {
  const gridClasses = view === "list" 
    ? "flex flex-col gap-6" 
    : "grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4";

  return (
    <div className={gridClasses}>
      {Array.from({ length: 8 }).map((_, i) => (
        <ProductSkeleton key={i} view={view} />
      ))}
    </div>
  );
}

export default async function ProductsPage({ searchParams }: PageProps) {
  const { q, category, minPrice, maxPrice, sort, view } = await searchParams;
  const payload = await getPayload({ config });

  // 1. Fetch categories for filters (Keep this in the main page as it's small/fast)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const categoriesRes = await (payload as any).find({
    collection: "categories",
    limit: 100,
  });

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
                Find your masterpiece
              </p>
            </div>
          </div>
          
          <ProductSort 
            currentSort={sort || "newest"} 
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            categories={categoriesRes.docs.map((c: any) => ({ id: c.id, name: c.name, slug: c.slug }))}
            currentCategory={category}
            currentMinPrice={minPrice}
            currentMaxPrice={maxPrice}
          />
        </div>

        <div className="flex flex-col lg:flex-row gap-10">
          {/* Sidebar Filters - Hidden on Mobile, shown on Large Screens */}
          <aside className="hidden lg:block w-full lg:w-72 shrink-0">
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

          {/* Main Content Area with Suspense for Streaming */}
          <main className="flex-1">
            <Suspense 
              key={`${q}-${category}-${minPrice}-${maxPrice}-${sort}-${view}`} 
              fallback={<ProductsGridSkeleton view={view} />}
            >
              <ProductList 
                q={q} 
                category={category} 
                minPrice={minPrice} 
                maxPrice={maxPrice} 
                sort={sort} 
                view={view} 
              />
            </Suspense>
          </main>
        </div>
      </div>
    </div>
  );
}
