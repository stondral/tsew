import React from 'react';
import ProductsGrid from './ProductsGrid';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { mapPayloadProductToDomain } from '@/lib/products';

export default async function FeaturedProducts() {
  const payload = await getPayload({ config });
  const { getProductList } = await import('@/lib/redis/product');

  try {
    const result = await getProductList(
      'featured',
      1,
      { limit: '8' },
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await (payload as any).find({
          collection: 'products',
          where: {
            status: { equals: 'live' },
            isActive: { equals: true },
            featured: { equals: true },
          },
          limit: 8,
          depth: 1,
          overrideAccess: true,
        });

        return {
          docs: data?.docs?.map((p: unknown) => mapPayloadProductToDomain(p)) ?? [],
          totalDocs: data?.totalDocs || 0,
          totalPages: data?.totalPages || 0,
          page: data?.page || 1,
        };
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = (result?.products as any[]) || [];

    if (!products.length) {
      return null;
    }

    return <ProductsGrid products={products} />;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return <p className="text-center text-gray-500 py-8">Unable to load featured products.</p>;
  }
}
