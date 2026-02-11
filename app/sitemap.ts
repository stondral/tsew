import { MetadataRoute } from 'next';
import { getPayload } from "payload";
import config from "@/payload.config";

export const dynamic = 'force-dynamic';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config });

  // Fetch all live products
  const products = await payload.find({
    collection: "products",
    where: {
      status: {
        equals: 'live',
      },
    },
    limit: 1000,
    select: {
      slug: true,
      updatedAt: true,
    },
  }) as unknown as { docs: Array<{ slug: string; updatedAt: string }> };

  // Fetch all categories
  const categories = await payload.find({
    collection: "categories",
    limit: 100,
    select: {
      name: true,
      slug: true,
    },
  }) as unknown as { docs: Array<{ name: string; slug: string }> };

  const productSitemaps = products.docs.map((product) => ({
    url: `https://stondemporium.tech/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.8,
  }));

  const categorySitemaps = categories.docs.map((category) => ({
    url: `https://stondemporium.tech/products?category=${encodeURIComponent(category.name)}`,
    lastModified: new Date().toISOString(),
    changeFrequency: 'daily' as const,
    priority: 0.7,
  }));

  const mainPages = [
    {
      url: 'https://stondemporium.tech',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://stondemporium.tech/products',
      lastModified: new Date().toISOString(),
      changeFrequency: 'daily' as const,
      priority: 0.9,
    },
    {
      url: 'https://stondemporium.tech/about-us',
      lastModified: new Date().toISOString(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...mainPages, ...productSitemaps, ...categorySitemaps];
}
