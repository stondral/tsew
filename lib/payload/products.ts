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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: p.media ? resolveMediaUrl(p.media as any) : null,
      images: Array.isArray(p.media)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? p.media.map((m: any) => resolveMediaUrl(m))
        : p.media
        ? [resolveMediaUrl(p.media)]
        : [],
      category: {
        name: typeof p.category === 'object' ? p.category.name : (p.category || 'Uncategorized')
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants: (p.variants || []).map((v: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image: v.image ? resolveMediaUrl(v.image as any) : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: v.id as any,
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: p.media ? resolveMediaUrl(p.media as any) : null,
      images: Array.isArray(p.media)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? p.media.map((m: any) => resolveMediaUrl(m))
        : p.media
        ? [resolveMediaUrl(p.media)]
        : [],
      category: {
        name: typeof p.category === 'object' ? p.category.name : (p.category || 'Uncategorized')
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants: (p.variants || []).map((v: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image: v.image ? resolveMediaUrl(v.image as any) : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: v.id as any,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        attributes: v.attributes || []
      })),
    })) ?? []
  );
}

// Get products for a specific seller
export async function getSellerProducts(sellerId: string, limit = 16) {
  const payload = await getPayload({ config });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (payload as any).find({
    collection: "products",
    where: {
      seller: { equals: sellerId },
      status: { equals: "live" },
      isActive: { equals: true },
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: p.media ? resolveMediaUrl(p.media as any) : null,
      images: Array.isArray(p.media)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? p.media.map((m: any) => resolveMediaUrl(m))
        : p.media
        ? [resolveMediaUrl(p.media)]
        : [],
      category: {
        name: typeof p.category === 'object' ? p.category.name : (p.category || 'Uncategorized')
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants: (p.variants || []).map((v: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image: v.image ? resolveMediaUrl(v.image as any) : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: v.id as any,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        attributes: v.attributes || []
      })),
    })) ?? []
  );
}
