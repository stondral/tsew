'use server';

import { Product } from "./product";
import { resolveMediaUrl } from "@/lib/media";



export async function getProductById(
  id: string
): Promise<Product | null> {
  const isServer = typeof window === "undefined";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let p: any; // Keep any for local dynamic parsing from JSON or Payload, or use unknown

  if (isServer) {
    const { getPayload } = await import("payload");
    const { default: config } = await import("@/payload.config");
    const payload = await getPayload({ config });
    p = await payload.findByID({
      collection: "products",
      id,
      depth: 3,
      overrideAccess: true,
    });
  } else {
    const baseUrl = (process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000");
    const res = await fetch(
      `${baseUrl}/api/products/${id}?depth=3`,
      { cache: "no-store" }
    );
    if (!res.ok) return null;
    p = await res.json();
  }

  if (!p) return null;

  return {
    id: p.id,
    name: p.name,
    slug: p.slug,

    /* Pricing */
    basePrice: p.basePrice,
    price: p.price ?? p.basePrice,
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
      name: (typeof p.category === 'object' && p.category?.name) ? p.category.name :
             (typeof p.category === 'string' ? p.category : "Uncategorized"),
    },

    /* ✅ Media (single OR multiple safe handling) */
    images: Array.isArray(p.media)
      ? p.media.map((m: { url?: string; thumbnail?: string; alt?: string }) => resolveMediaUrl(m))
      : p.media
      ? [resolveMediaUrl(p.media)]
      : [],

    /* ✅ Variants */
    variants:
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (p.variants || p.productVariants)?.map((v: { id: string; name: string; sku: string; price: number; stock: number; image: any; attributes: any[] }) => ({
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

    /* Seller */
    seller: p.seller
      ? {
          id: typeof p.seller === "object" ? p.seller.id : p.seller,
          name: typeof p.seller === "object" ? p.seller.name : undefined,
          username: typeof p.seller === "object" ? p.seller.slug : undefined,
          email: typeof p.seller === "object" ? p.seller.email : undefined,
          isVerified: typeof p.seller === "object" ? p.seller.subscriptionStatus === 'active' : false,
        }
      : undefined,
  };
}
