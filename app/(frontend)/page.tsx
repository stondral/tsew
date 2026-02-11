import Hero from "@/components/Hero";
import ProductsGrid from "@/components/products/ProductsGrid";
import { getSellerFromHeaders, getCapabilities, resolveTheme, type ExtendedUser } from "@/lib/seller";
import StoreLayout from "@/components/storefront/StoreLayout";
import StoreSections from "@/components/storefront/StoreSections";
import { Metadata } from "next";

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

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

// Use localhost in development, but allow production URL override
const getBaseUrl = () => {
  // In production, use the NEXT_PUBLIC_PAYLOAD_URL or NEXT_PUBLIC_FRONTEND_URL
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_PAYLOAD_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  }
  // In development, always use localhost to avoid cross-server issues
  return 'http://localhost:3000';
};

const SITE_URL = getBaseUrl();

export default async function HomePage() {
  const sellerContext = await getSellerFromHeaders();

  if (sellerContext) {
    try {
      // Fetch seller data via API
      const sellerRes = await fetch(`${SITE_URL}/api/seller?id=${sellerContext.id}`, {
        cache: 'no-store',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (sellerRes.ok) {
        const { seller } = await sellerRes.json() as { seller: ExtendedUser };
        const capabilities = getCapabilities(seller.plan);
        const theme = resolveTheme(seller.theme, capabilities);

        // Fetch seller products via API
        const productsRes = await fetch(`${SITE_URL}/api/products?type=seller&sellerId=${seller.id}&limit=16`, {
          cache: 'no-store',
          headers: {
            'Content-Type': 'application/json',
          },
        });

        const { products: sellerProducts } = await productsRes.json();

        return (
          <StoreLayout theme={theme}>
            <StoreSections 
              seller={seller} 
              products={sellerProducts || []} 
              layoutControl={capabilities.layoutControl} 
            />
          </StoreLayout>
        );
      }
    } catch (error) {
      console.error('Error fetching seller data:', error);
    }
  }

  // PLATFORM DEFAULT - Fetch featured products via API
  try {
    // Use relative URL for server-side fetch to ensure it hits the same server (dev or prod)
    const productsRes = await fetch(`${SITE_URL}/api/products?type=featured&limit=16&t=${Date.now()}`, {
      cache: 'no-store',
      next: { revalidate: 0 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { products: featuredProducts } = await productsRes.json();

    return (
      <>
        <Hero />

        <section className="py-12 bg-white">
          <div className="px-4 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Featured <span className="text-orange-500">Innovations</span>
            </h2>

            <ProductsGrid products={featuredProducts || []} />
          </div>
        </section>
      </>
    );
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return (
      <>
        <Hero />
        <section className="py-12 bg-white">
          <div className="px-4 max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold mb-6 text-center">
              Featured <span className="text-orange-500">Innovations</span>
            </h2>
            <p className="text-center text-gray-500">Unable to load products at this time.</p>
          </div>
        </section>
      </>
    );
  }
}
