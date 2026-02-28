import Hero from "@/components/Hero";
import { getSellerFromHeaders, getCapabilities, resolveTheme, type ExtendedUser } from "@/lib/seller";
import StoreLayout from "@/components/storefront/StoreLayout";
import StoreSections from "@/components/storefront/StoreSections";
import { Metadata } from "next";
import { Suspense } from "react";
import FeaturedProducts from "@/components/products/FeaturedProducts";
import { ProductsGridSkeleton } from "@/components/products/ProductsGridSkeleton";
import { getPayload } from "payload";
import config from "@/payload.config";
import { mapPayloadProductToDomain } from "@/lib/products";

export const metadata: Metadata = {
  title: "Buy Premium Products Online in India | Multi-Vendor Marketplace | Stondemporium",
  description: "Shop premium products from top sellers at Stondemporium. India's trusted multi-vendor marketplace with fast delivery. Discover jewellery, electronics, fashion & more!",
  keywords: [
    "online shopping India",
    "multi-vendor marketplace",
    "buy products online India",
    "premium products",
    "e-commerce India",
    "online marketplace",
    "shop online India",
    "best deals online",
    "fast delivery India",
    "Stondemporium",
    "jewellery online India",
    "electronics online",
    "fashion shopping",
  ],
  alternates: {
    canonical: 'https://stondemporium.tech',
  },
  openGraph: {
    title: "Stondemporium - India's Premium Multi-Vendor Marketplace",
    description: "Shop premium products from verified sellers. Fast delivery across India.",
    url: 'https://stondemporium.tech',
    siteName: 'Stondemporium',
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: '/icon.jpg',
        width: 1200,
        height: 630,
        alt: 'Stondemporium Marketplace',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: "Stondemporium - Premium Online Marketplace",
    description: "Shop from top sellers with fast delivery across India.",
    images: ['/icon.jpg'],
  },
};

export const revalidate = 60; // ISR with 60-second revalidation
export const runtime = 'nodejs';

export default async function HomePage() {
  const sellerContext = await getSellerFromHeaders();
  const payload = await getPayload({ config });

  if (sellerContext) {
    try {
      const seller = await payload.findByID({
        collection: 'users',
        id: sellerContext.id,
      }) as unknown as ExtendedUser;

      if (seller) {
        const capabilities = getCapabilities(seller.plan);
        const theme = resolveTheme(seller.theme, capabilities);

        const data = await payload.find({
          collection: 'products',
          where: {
            status: { equals: 'live' },
            isActive: { equals: true },
            seller: { equals: seller.id },
          },
          limit: 8,
          depth: 1,
          overrideAccess: true,
        });

        const sellerProducts = data?.docs?.map((p: unknown) => mapPayloadProductToDomain(p)) || [];

        return (
          <StoreLayout theme={theme}>
            <StoreSections 
              seller={seller} 
              products={sellerProducts} 
              layoutControl={capabilities.layoutControl} 
            />
          </StoreLayout>
        );
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    }
  }

  // PLATFORM DEFAULT
  return (
    <>
      <Hero />

      <section className="py-12 bg-white">
        <div className="px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center" style={{ fontFamily: "'Roboto Slab', serif" }}>
            Featured <span className="text-orange-500">Innovations</span>
          </h2>

          <Suspense fallback={<ProductsGridSkeleton count={4} />}>
            <FeaturedProducts />
          </Suspense>
        </div>
      </section>
    </>
  );
}
