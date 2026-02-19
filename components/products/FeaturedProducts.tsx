import React from 'react';
import ProductsGrid from './ProductsGrid';

const getBaseUrl = () => {
  if (process.env.NODE_ENV === 'production') {
    return process.env.NEXT_PUBLIC_PAYLOAD_URL || process.env.NEXT_PUBLIC_FRONTEND_URL || 'http://localhost:3000';
  }
  return 'http://localhost:3000';
};

const SITE_URL = getBaseUrl();

export default async function FeaturedProducts() {
  try {
    const productsRes = await fetch(`${SITE_URL}/api/products?type=featured&limit=8`, {
      cache: 'force-cache',
      next: { revalidate: 60 },
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!productsRes.ok) throw new Error('Failed to fetch featured products');
    
    const { products } = await productsRes.json();

    return <ProductsGrid products={products || []} />;
  } catch (error) {
    console.error('Error fetching featured products:', error);
    return <p className="text-center text-gray-500 py-8">Unable to load featured products.</p>;
  }
}
