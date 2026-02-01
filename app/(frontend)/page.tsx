import Hero from "@/components/Hero";
import ProductsGrid from "@/components/products/ProductsGrid";
import { getSellerFromHeaders, getCapabilities, resolveTheme, type ExtendedUser } from "@/lib/seller";
import StoreLayout from "@/components/storefront/StoreLayout";
import StoreSections from "@/components/storefront/StoreSections";

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

const SITE_URL = process.env.NEXT_PUBLIC_PAYLOAD_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';

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
    const productsRes = await fetch(`${SITE_URL}/api/products?type=featured&limit=16`, {
      cache: 'no-store',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    const { products: featuredProducts } = await productsRes.json();
    console.log(`🏠 HomePage: Found ${featuredProducts?.length || 0} featured products`);

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
