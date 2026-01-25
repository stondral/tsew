import Hero from "@/components/Hero";
import ProductsGrid from "@/components/products/ProductsGrid";
import { getFeaturedProducts, getSellerProducts } from "@/lib/payload/products";
import { getSellerFromHeaders, getSellerFullData, getCapabilities, resolveTheme } from "@/lib/seller";
import StoreLayout from "@/components/storefront/StoreLayout";
import StoreSections from "@/components/storefront/StoreSections";

export default async function HomePage() {
  const sellerContext = await getSellerFromHeaders();

  if (sellerContext) {
    const seller = await getSellerFullData(sellerContext.id);
    if (seller) {
      const capabilities = getCapabilities(seller.plan);
      const theme = resolveTheme(seller.theme, capabilities);
      const sellerProducts = await getSellerProducts(seller.id, 16);

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
  }

  // PLATFORM DEFAULT
  const featuredProducts = await getFeaturedProducts(16);
  console.log(`🏠 HomePage: Found ${featuredProducts.length} featured products`);

  return (
    <>
      <Hero />

      <section className="py-12 bg-white">
        <div className="px-4 max-w-6xl mx-auto">
          <h2 className="text-2xl font-bold mb-6 text-center">
            Featured <span className="text-orange-500">Innovations</span>
          </h2>

          <ProductsGrid products={featuredProducts} />
        </div>
      </section>
    </>
  );
}
