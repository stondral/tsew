import { resolveMediaUrl } from "./media";
import { Product as DomainProduct } from "./models/domain/product";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function mapPayloadProductToDomain(p: any): DomainProduct {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    description: p.description,
    basePrice: p.basePrice,
    price: (p.price && p.price > 0) ? p.price : p.basePrice,
    compareAtPrice: p.compareAtPrice,
    isActive: p.isActive,
    status: p.status,
    popularity: p.popularity,
    averageRating: p.averageRating || 0,
    reviewCount: p.reviewCount || 0,
    ratingDistribution: p.ratingDistribution || { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 },
    featured: p.featured,
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
    refundPolicy: p.refundPolicy,
    seller: p.seller ? {
      id: typeof p.seller === 'object' ? p.seller.id : p.seller,
      name: typeof p.seller === 'object' ? (p.seller.name || p.seller.username) : undefined,
    } : undefined
  };
}
