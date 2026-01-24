import { Product } from "./product";
import { resolveMediaUrl } from "@/lib/media";

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const baseUrl = (typeof window !== "undefined") ? "" : (process.env.NEXT_PUBLIC_PAYLOAD_URL || "http://localhost:3000");
  const res = await fetch(
    `${baseUrl}/api/products?` +
      new URLSearchParams({
        "where[slug][equals]": slug,
        "where[status][equals]": "live",
        "where[isActive][equals]": "true",
        limit: "1",
        depth: "3",
        populate: "category,media,variants.image,variants.stock,stock,seller",
      }),
    { cache: "no-store" }
  );

  if (!res.ok) return null;

  const data = await res.json();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const p = (data?.docs?.[0]) as any;
  if (!p) return null;

  return {
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

    /* Seller */
    seller: p.seller
      ? {
          id: typeof p.seller === "object" ? p.seller.id : p.seller,
          name: typeof p.seller === "object" ? (p.seller.username || p.seller.email) : undefined,
          email: typeof p.seller === "object" ? p.seller.email : undefined,
        }
      : undefined,
  };
}
