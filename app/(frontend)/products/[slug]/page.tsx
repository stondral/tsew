import { notFound } from "next/navigation";
import { Metadata } from "next";

import ProductDetailClient from "@/components/products/ProductDetailClient";
import { resolveMediaUrl } from "@/lib/media";
import { getProductBySlug } from "@/lib/models/domain/getProductBySlug";

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    return {
      title: "Product Not Found | Stondemporium",
    };
  }

  return {
    title: `${product.name} | Stondemporium`,
    description: product.description?.slice(0, 160),
    openGraph: {
      title: product.name,
      description: product.description?.slice(0, 160),
      images: product.images?.[0] ? [resolveMediaUrl(product.images[0])] : [],
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const images = (product.images ?? []).map((src) => resolveMediaUrl(src));

  return <ProductDetailClient product={product} images={images} />;
}
