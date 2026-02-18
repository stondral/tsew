import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { redirect, notFound } from "next/navigation";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import { resolveMediaUrl } from "@/lib/media";
import { getReviews } from "@/app/(frontend)/products/actions/reviews";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Eye } from "lucide-react";

export const dynamic = 'force-dynamic';

export const metadata = {
  robots: { index: false, follow: false },
  title: "Preview Product | Stond Emporium",
};

export default async function PreviewProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const payload = await getPayload({ config });
  const requestHeaders = await headers();

  const { user } = await payload.auth({
    headers: requestHeaders,
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const userRole = (user as any)?.role;
  if (!user || (userRole !== "seller" && userRole !== "admin" && userRole !== "sellerEmployee")) {
    redirect(`/auth?redirect=/seller/products/preview/${id}`);
  }

  // Fetch the product with overrideAccess so draft/pending products are visible
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const product = await (payload as any).findByID({
    collection: "products",
    id,
    depth: 2,
    overrideAccess: true,
  }).catch(() => null);

  if (!product) {
    notFound();
  }

  // Security: Only the product owner (or admin) can preview
  const productSellerId = typeof product.seller === 'object' ? product.seller.id : product.seller;
  
  if (userRole !== "admin") {
    const { hasPermission } = await import("@/lib/rbac/permissions");
    const canView = await hasPermission(payload, user.id, productSellerId, 'product.view');
    if (!canView) {
      redirect("/seller/products");
    }
  }

  // Build the product shape expected by ProductDetailClient
  const images = (product.media ?? [])
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .filter((m: any) => m && typeof m === 'object')
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    .map((m: any) => resolveMediaUrl(m));

  const reviewsData = await getReviews(product.id).catch(() => ({ success: false, reviews: [] }));

  // Build a normalized product object for ProductDetailClient
  const normalizedProduct = {
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    basePrice: product.basePrice,
    compareAtPrice: product.compareAtPrice,
    stock: product.stock,
    sku: product.sku,
    category: typeof product.category === 'object' ? product.category : { id: product.category, name: 'Category' },
    seller: typeof product.seller === 'object' ? product.seller : { id: product.seller, name: 'Seller' },
    variants: (product.variants || []).map((v: { id: string; name: string; sku: string; price: number; stock: number; image?: { url?: string } | string | null; attributes?: { name: string; value: string }[] }) => ({
      id: v.id,
      name: v.name,
      sku: v.sku,
      price: v.price,
      stock: v.stock,
      image: v.image ? resolveMediaUrl(v.image) : null,
      attributes: v.attributes || [],
    })),
    attributes: product.attributes || [],
    images,
    averageRating: product.averageRating || 0,
    reviewCount: product.reviewCount || 0,
    refundPolicy: product.refundPolicy,
    isActive: product.isActive,
    status: product.status,
  };

  return (
    <>
      {/* Preview Mode Banner */}
      <div className="sticky top-0 z-50 bg-amber-400 border-b border-amber-500 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 bg-amber-600/20 rounded-lg flex items-center justify-center">
              <Eye className="h-4 w-4 text-amber-900" />
            </div>
            <div>
              <p className="text-amber-900 font-black text-sm uppercase tracking-wider">
                🟡 Preview Mode
              </p>
              <p className="text-amber-800/70 text-xs font-bold">
                Only visible to you. This product is not live yet.
              </p>
            </div>
          </div>
          <Link href={`/seller/products/edit/${id}`}>
            <Button
              variant="outline"
              size="sm"
              className="bg-white/80 hover:bg-white text-amber-900 border-amber-600/30 rounded-xl font-bold text-xs gap-2"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to Editor
            </Button>
          </Link>
        </div>
      </div>

      {/* Product Detail — Same as storefront */}
      <ProductDetailClient
        product={normalizedProduct}
        images={images}
        initialReviews={reviewsData.success ? reviewsData.reviews : []}
      />
    </>
  );
}
