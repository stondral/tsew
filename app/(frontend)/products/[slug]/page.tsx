import { notFound } from "next/navigation";
import { Metadata } from "next";
import { cache } from "react";

export const revalidate = 3600; // Revalidate every hour

import ProductDetailClient from "@/components/products/ProductDetailClient";
import { resolveMediaUrl } from "@/lib/media";
import { getProductBySlug } from "@/lib/models/domain/getProductBySlug";
import { getReviews } from "@/app/(frontend)/products/actions/reviews";

// Memoize product fetch to prevent duplicate queries in metadata + page render
const getCachedProduct = cache(async (slug: string) => {
  const product = await getProductBySlug(slug);
  return product;
});

interface ProductPageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({
  params,
}: ProductPageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getCachedProduct(slug);

  if (!product) {
    return {
      title: "Product Not Found | Stondemporium",
    };
  }

  // Generate dynamic keywords
  const keywords = [
    product.name,
    product.category.name,
    `buy ${product.name.toLowerCase()} online`,
    `${product.category.name.toLowerCase()} India`,
    `buy ${product.category.name.toLowerCase()} online`,
    "online shopping India",
    "premium products",
    product.seller?.name || "Stondemporium",
  ];

  // Add variant attributes to keywords
  if (product.variants && product.variants.length > 0) {
    product.variants.forEach(variant => {
      variant.attributes.forEach(attr => {
        keywords.push(`${attr.value} ${product.category.name.toLowerCase()}`);
      });
    });
  }

  const productUrl = `https://stondemporium.tech/products/${slug}`;
  const price = product.variants?.[0]?.price || product.basePrice || 0;
  const availability = (product.variants?.[0]?.stock || product.stock || 0) > 0 
    ? "https://schema.org/InStock" 
    : "https://schema.org/OutOfStock";

  return {
    title: `${product.name} | ${product.category.name} | Stondemporium`,
    description: product.description?.slice(0, 155) + "..." || `Buy ${product.name} online at Stondemporium. Premium ${product.category.name.toLowerCase()} with fast delivery across India.`,
    keywords,
    alternates: {
      canonical: productUrl,
    },
    openGraph: {
      type: 'website',
      siteName: 'Stondemporium',
      title: product.name,
      description: product.description?.slice(0, 155),
      url: productUrl,
      locale: 'en_IN',
      images: product.images?.[0] ? [
        {
          url: resolveMediaUrl(product.images[0]),
          width: 1200,
          height: 630,
          alt: product.name,
        }
      ] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: product.name,
      description: product.description?.slice(0, 155),
      images: product.images?.[0] ? [resolveMediaUrl(product.images[0])] : [],
      creator: product.seller?.username ? `@${product.seller.username}` : '@stondemporium',
    },
    other: {
      'product:price:amount': price.toString(),
      'product:price:currency': 'INR',
      'product:availability': availability.includes('InStock') ? 'in stock' : 'out of stock',
      'product:condition': 'new',
    },
  };
}

export default async function ProductPage({ params }: ProductPageProps) {
  const { slug } = await params;

  // Fetch product and reviews in parallel on server
  const [product, reviewsData] = await Promise.all([
    getCachedProduct(slug),
    getCachedProduct(slug).then(p => p ? getReviews(p.id) : { success: false, reviews: [] })
  ]);
  
  if (!product) notFound();

  const images = (product.images ?? []).map((src) => resolveMediaUrl(src));
  const price = product.variants?.[0]?.price || product.basePrice || 0;
  const availability = (product.variants?.[0]?.stock || product.stock || 0) > 0 
    ? "https://schema.org/InStock" 
    : "https://schema.org/OutOfStock";

  // Product Schema
  const productSchema = {
    "@context": "https://schema.org/",
    "@type": "Product",
    "name": product.name,
    "image": images,
    "description": product.description,
    "sku": product.sku || product.variants?.[0]?.sku || "N/A",
    "brand": {
      "@type": "Brand",
      "name": product.seller?.name || "Stondemporium"
    },
    "offers": {
      "@type": "Offer",
      "url": `https://stondemporium.tech/products/${slug}`,
      "priceCurrency": "INR",
      "price": price,
      "availability": availability,
      "priceValidUntil": new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      "seller": {
        "@type": "Organization",
        "name": product.seller?.name || "Stondemporium"
      }
    },
    ...(product.averageRating && product.reviewCount ? {
      "aggregateRating": {
        "@type": "AggregateRating",
        "ratingValue": product.averageRating,
        "reviewCount": product.reviewCount,
        "bestRating": "5",
        "worstRating": "1"
      }
    } : {})
  };

  // BreadcrumbList Schema
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "itemListElement": [
      {
        "@type": "ListItem",
        "position": 1,
        "name": "Home",
        "item": "https://stondemporium.tech"
      },
      {
        "@type": "ListItem",
        "position": 2,
        "name": "Products",
        "item": "https://stondemporium.tech/products"
      },
      {
        "@type": "ListItem",
        "position": 3,
        "name": product.category.name,
        "item": `https://stondemporium.tech/products?category=${encodeURIComponent(product.category.name)}`
      },
      {
        "@type": "ListItem",
        "position": 4,
        "name": product.name,
        "item": `https://stondemporium.tech/products/${slug}`
      }
    ]
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(productSchema)
        }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(breadcrumbSchema)
        }}
      />
      <ProductDetailClient 
        product={product} 
        images={images}
        initialReviews={reviewsData.success ? reviewsData.reviews : []}
      />
    </>
  );
}
