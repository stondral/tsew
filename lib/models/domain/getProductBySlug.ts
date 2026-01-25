import { getPayload } from "payload";
import config from "@/payload.config";
import { Product } from "./product";
import { resolveMediaUrl } from "@/lib/media";

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const payload = await getPayload({ config });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data = await (payload as any).find({
    collection: "products",
    where: {
      slug: { equals: slug },
      status: { equals: "live" },
      isActive: { equals: true },
    },
    limit: 1,
    depth: 3,
  });

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
          username: typeof p.seller === "object" ? p.seller.username : undefined,
          email: typeof p.seller === "object" ? p.seller.email : undefined,
        }
      : undefined,
  };
}
