import { resolveMediaUrl } from "@/lib/media";

import { getPayload } from "payload";
import config from "@/payload.config";

// Get all live products
export async function getAllProducts() {
  const payload = await getPayload({ config });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (payload as any).find({
    collection: "products",
    where: {
      status: { equals: "live" },
      isActive: { equals: true },
    },
    limit: 100,
    depth: 1,
  });

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.docs?.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: p.basePrice,
      price: (p.price && p.price > 0) ? p.price : p.basePrice,
      compareAtPrice: p.compareAtPrice,
      isActive: p.isActive,
      status: p.status,
      popularity: p.popularity,
      image: p.media ? resolveMediaUrl(p.media as any) : null,
      images: Array.isArray(p.media)
        ? p.media.map((m: any) => resolveMediaUrl(m))
        : p.media
        ? [resolveMediaUrl(p.media)]
        : [],
      variants: (p.variants || []).map((v: any) => ({
        image: v.image ? resolveMediaUrl(v.image as any) : null,
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        attributes: v.attributes || []
      })),
    })) ?? []
  );
}

// Get featured products
export async function getFeaturedProducts(limit = 8) {
  const payload = await getPayload({ config });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (payload as any).find({
    collection: "products",
    where: {
      status: { equals: "live" },
      isActive: { equals: true },
      featured: { equals: true },
    },
    limit,
    depth: 2,
  });

  return (
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    data?.docs?.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: p.basePrice,
      price: (p.price && p.price > 0) ? p.price : p.basePrice,
      compareAtPrice: p.compareAtPrice,
      isActive: p.isActive,
      status: p.status,
      popularity: p.popularity,
      featured: p.featured,
      image: p.media ? resolveMediaUrl(p.media as any) : null,
      images: Array.isArray(p.media)
        ? p.media.map((m: any) => resolveMediaUrl(m))
        : p.media
        ? [resolveMediaUrl(p.media)]
        : [],
      category: {
        name: typeof p.category === 'object' ? p.category.name : (p.category || 'Uncategorized')
      },
      variants: (p.variants || []).map((v: any) => ({
        image: v.image ? resolveMediaUrl(v.image as any) : null,
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        attributes: v.attributes || []
      })),
    })) ?? []
  );
}
