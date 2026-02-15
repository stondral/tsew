'use server';

import { Product } from "./product";
import { resolveMediaUrl } from "@/lib/media";

export async function getProductBySlug(slug: string): Promise<Product | null> {
  // Try Redis cache first
  const cacheKey = `product:slug:${slug}`;
  
  try {
    const { default: redis } = await import('@/lib/redis/client');
    
    // Check cache
    const cached = await redis.get<Product>(cacheKey);
    if (cached) {
      console.log(`✅ [CACHE HIT] Product: ${slug}`);
      return cached;
    }
    
    console.log(`⚠️ [CACHE MISS] Product: ${slug}`);
  } catch (cacheError) {
    console.error('[Redis] Cache read error, proceeding to DB:', cacheError);
  }
  
  // Fetch from database
  const { getPayload } = await import("payload");
  const { default: config } = await import("@/payload.config");
  const payload = await getPayload({ config });
  
  console.time(`[DB] Product query: ${slug}`);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (payload as any).find({
    collection: "products",
    where: {
      slug: { equals: slug },
      status: { equals: "live" },
      isActive: { equals: true },
    },
    limit: 1,
    depth: 2,
    select: {
      name: true,
      slug: true,
      description: true,
      basePrice: true,
      compareAtPrice: true,
      isActive: true,
      status: true,
      featured: true,
      featuredUntil: true,
      sku: true,
      stock: true,
      weight: true,
      dimensions: true,
      seller: true,
      category: true,
      media: true,
      variants: true,
      attributes: true,
      refundPolicy: true,
      averageRating: true,
      reviewCount: true,
      ratingDistribution: true,
    },
    overrideAccess: true,
  });
  console.timeEnd(`[DB] Product query: ${slug}`);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (data?.docs?.[0]) as any;
  if (!p) return null;

  const product: Product = {
    id: p.id,
    name: p.name,
    slug: p.slug,

    /* Pricing */
    basePrice: p.basePrice,
    price: (p.price && p.price > 0) ? p.price : p.basePrice,
    compareAtPrice: p.compareAtPrice,

    /* Visibility */
    isActive: p.isActive,
    status: p.status,

    /* Featured */
    featured: p.featured,
    featuredUntil: p.featuredUntil ?? null,

    /* Inventory */
    sku: p.sku,
    stock: p.stock,

    /* Policy */
    refundPolicy: p.refundPolicy,

    /* Required */
    description: p.description ?? "",

    /* Category */
    category: {
      name:
        typeof p.category === "object" && p.category?.name
          ? p.category.name
          : typeof p.category === "string"
            ? p.category
            : "Uncategorized",
    },

    /* Media */
    images: Array.isArray(p.media)
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      ? p.media.map((m: any) => resolveMediaUrl(m))
      : p.media
        ? [resolveMediaUrl(p.media)]
        : [],

    /* Variants */
    variants:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.variants || p.productVariants)?.map((v: any) => ({
        id: v.id,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        image: v.image ? resolveMediaUrl(v.image) : undefined,
        attributes: v.attributes ?? [],
      })) ?? [],

    /* Signals */
    popularity: p.popularity,
    averageRating: p.averageRating || 0,
    reviewCount: p.reviewCount || 0,
    ratingDistribution: p.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },

    /* Seller */
    seller: (() => {
      if (!p.seller) {
        return undefined;
      }
      
      const s = p.seller;
      console.log("DEBUG: product.seller populated data:", JSON.stringify(s, null, 2));

      // If s is just an ID (not populated)
      if (typeof s === 'string') {
        return {
          id: s,
          name: "Unknown Seller",
          isVerified: false
        };
      }

      // If s is a populated object
      return {
        id: s.id,
        name: s.name || "Unknown Seller",
        username: s.slug || undefined,
        email: s.email || undefined,
        isVerified: s.subscriptionStatus === 'active',
      };
    })(),
  };
  
  // Cache the product (fire and forget, don't block response)
  try {
    const { default: redis } = await import('@/lib/redis/client');
    const { REDIS_CONFIG } = await import('@/lib/redis/config');
    
    // Cache for 1 hour (3600 seconds)
    await redis.setex(cacheKey, REDIS_CONFIG.TTL.PRODUCT, product);
    console.log(`✅ [CACHED] Product: ${slug}`);
  } catch (cacheError) {
    console.error('[Redis] Cache write error (non-blocking):', cacheError);
  }
  
  return product;
}
