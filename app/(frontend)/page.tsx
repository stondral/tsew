import Hero from "@/components/Hero";
import ProductsGrid from "@/components/products/ProductsGrid";
import { getFeaturedProducts } from "@/lib/payload/products";

export default async function HomePage() {
  const featuredProducts = await getFeaturedProducts(16);

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
