import { resolveMediaUrl } from "@/lib/media";

// Get all live products
export async function getAllProducts() {
  const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/products?` +
      new URLSearchParams({
        "where[status][equals]": "live",
        "where[isActive][equals]": "true",
        limit: "100",
        depth: "1",
      }),
    { cache: "no-store" }
  );

  if (!res.ok) return [];

  const data = await res.json();
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants: (p.variants || []).map((v: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
  const baseUrl = process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000";
  const res = await fetch(
    `${baseUrl}/api/products?` +
      new URLSearchParams({
        "where[status][equals]": "live",
        "where[isActive][equals]": "true",
        "where[featured][equals]": "true",
        limit: limit.toString(),
        depth: "2",
      }),
    { cache: "no-store" }
  );

  if (!res.ok) return [];

  const data = await res.json();
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
