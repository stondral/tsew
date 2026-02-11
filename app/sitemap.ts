import { MetadataRoute } from 'next';
import { getPayload } from "payload";
import config from "@/payload.config";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const payload = await getPayload({ config });

  // Fetch all products
  const products = await payload.find({
    collection: "products",
    limit: 1000,
    select: {
      slug: true,
      updatedAt: true,
    },
  }) as unknown as { docs: Array<{ slug: string; updatedAt: string }> };

  const productSitemaps = products.docs.map((product) => ({
    url: `https://stondemporium.tech/products/${product.slug}`,
    lastModified: product.updatedAt,
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  const mainPages = [
    {
      url: 'https://stondemporium.tech',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 1,
    },
    {
      url: 'https://stondemporium.tech/products',
      lastModified: new Date(),
      changeFrequency: 'daily' as const,
      priority: 0.8,
    },
    {
      url: 'https://stondemporium.tech/about-us',
      lastModified: new Date(),
      changeFrequency: 'monthly' as const,
      priority: 0.5,
    },
  ];

  return [...mainPages, ...productSitemaps];
}
