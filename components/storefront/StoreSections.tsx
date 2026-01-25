import React from 'react'
import ProductsGrid from "@/components/products/ProductsGrid";
import { ExtendedUser, PlanCapabilities } from '@/lib/seller';
import { Product } from '@/lib/models/domain/product';

export default function StoreSections({ seller, products, layoutControl }: { seller: ExtendedUser, products: Product[], layoutControl: PlanCapabilities['layoutControl'] }) {
  return (
    <div className="store-sections">
      {/* Dynamic Hero based on layout control if needed */}
      <section className="py-20 bg-gradient-to-b from-orange-50 to-white text-center">
        <div className="max-w-4xl mx-auto px-4">
          <h1 className="text-5xl font-extrabold text-gray-900 mb-6">
            {seller.username}&apos;s Store
          </h1>
          <p className="text-xl text-gray-600 mb-8">
            Discover our curated collection of innovative products.
          </p>
        </div>
      </section>

      <section className="py-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-gray-900 mb-10 text-center">
          Featured Products
        </h2>
        <ProductsGrid products={products} />
      </section>

      {layoutControl === 'advanced' && (
        <section className="py-16 bg-gray-50">
          <div className="max-w-7xl mx-auto px-4">
             {/* Elite Sellers can have more sections here */}
             <div className="bg-white p-12 rounded-3xl shadow-sm text-center">
                <h3 className="text-2xl font-bold mb-4">Advanced Elite Section</h3>
                <p className="text-gray-500">This section is only visible to Elite sellers.</p>
             </div>
          </div>
        </section>
      )}
    </div>
  )
}
