"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  Star,
  Heart,
  Share2,
  ShieldCheck,
  Truck,
  RotateCcw,
  Package,
  Store,
  BadgeCheck,
  ChevronRight,
  Zap,
  Clock,
  ArrowLeft,
  X,
} from "lucide-react";

import { Product } from "@/lib/models/domain/product";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { cn } from "@/lib/utils";

import AddToCartButton from "@/components/cart/AddToCartButton";
import VariantSelector from "./VariantSelector";
import QuantitySelector from "./QuantitySelector";
import ProductReviews from "./ProductReviews";

interface ProductDetailClientProps {
  product: Product;
  images: string[];
}

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            "w-4 h-4",
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200",
          )}
        />
      ))}
    </div>
  );
}

export default function ProductDetailClient({
  product,
  images,
}: ProductDetailClientProps) {
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id ?? null,
  );
  const [quantity, setQuantity] = useState(1);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [imageZoom, setImageZoom] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  // Derived values
  const selectedVariant = useMemo(
    () => product.variants?.find((v) => v.id === selectedVariantId) ?? null,
    [product.variants, selectedVariantId],
  );

  const currentPrice = selectedVariant?.price ?? product.basePrice ?? 0;
  
  // For products without variants, if stock is not explicitly set, treat as unlimited (999999)
  // This prevents showing "Out of Stock" for products that don't use stock tracking
  const hasVariants = product.variants && product.variants.length > 0;
  const currentStock = selectedVariant 
    ? (selectedVariant.stock ?? 0) 
    : hasVariants 
      ? 0 
      : (product.stock ?? 999999);
  
  const currentSku = selectedVariant?.sku ?? product.sku ?? "N/A";

  const discountPercentage = product.compareAtPrice
    ? Math.round(
        ((product.compareAtPrice - currentPrice) / product.compareAtPrice) *
          100,
      )
    : 0;

  const isOutOfStock = currentStock <= 0;

  // Image zoom handler
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageZoom) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPosition({ x, y });
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      {/* Breadcrumbs & Back Button */}
      <div className="bg-white border-b pt-6">
        <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
          <nav className="flex items-center gap-2 text-sm overflow-x-auto whitespace-nowrap scrollbar-hide">
            <Link
              href="/"
              className="text-gray-500 hover:text-orange-600 transition-colors"
            >
              Home
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <Link
              href="/products"
              className="text-gray-500 hover:text-orange-600 transition-colors"
            >
              Products
            </Link>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-500">{product.category.name}</span>
            <ChevronRight className="w-4 h-4 text-gray-400" />
            <span className="text-gray-900 font-medium truncate max-w-[150px] md:max-w-[200px]">
              {product.name}
            </span>
          </nav>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="flex items-center gap-2 text-gray-500 hover:text-orange-600"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
      </div>

      {/* Floating Mobile Close Button */}
      <Button
        variant="secondary"
        size="icon"
        className="fixed top-6 right-6 z-[60] rounded-full w-12 h-12 bg-white/80 backdrop-blur-md shadow-2xl border border-gray-100 md:hidden hover:bg-white active:scale-90 transition-all group"
        onClick={() => window.history.back()}
      >
        <X className="w-6 h-6 text-gray-900 group-hover:text-orange-600 transition-colors" />
      </Button>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Left Column - Images */}
          <div className="space-y-4">
            {/* Main Image with Zoom */}
            <div
              className={cn(
                "relative aspect-square bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-lg cursor-zoom-in",
                imageZoom && "cursor-zoom-out",
              )}
              onMouseEnter={() => setImageZoom(true)}
              onMouseLeave={() => setImageZoom(false)}
              onMouseMove={handleMouseMove}
            >
              {images[selectedImageIndex] ? (
                <Image
                  src={images[selectedImageIndex]}
                  alt={product.name}
                  fill
                  className={cn(
                    "object-cover transition-transform duration-300",
                    imageZoom && "scale-150",
                  )}
                  style={
                    imageZoom
                      ? {
                          transformOrigin: `${zoomPosition.x}% ${zoomPosition.y}%`,
                        }
                      : undefined
                  }
                  unoptimized
                  priority
                />
              ) : (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100">
                  <Package className="w-20 h-20 text-gray-300" />
                </div>
              )}

              {/* Badges */}
              <div className="absolute top-4 left-4 flex flex-col gap-2">
                {discountPercentage > 0 && (
                  <Badge className="bg-gradient-to-r from-red-500 to-pink-500 text-white border-0 px-3 py-1 text-sm font-bold shadow-lg">
                    -{discountPercentage}% OFF
                  </Badge>
                )}
                {product.featured && (
                  <Badge className="bg-gradient-to-r from-amber-500 to-orange-500 text-white border-0 px-3 py-1 text-sm font-bold shadow-lg">
                    <Zap className="w-3 h-3 mr-1" />
                    Featured
                  </Badge>
                )}
                {isOutOfStock && (
                  <Badge className="bg-gray-800 text-white border-0 px-3 py-1 text-sm font-bold">
                    Out of Stock
                  </Badge>
                )}
              </div>

              {/* Action Buttons */}
              <div className="absolute top-4 right-4 flex flex-col gap-2">
                <Button
                  variant="secondary"
                  size="icon"
                  className={cn(
                    "rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white transition-all",
                    isWishlisted && "text-red-500",
                  )}
                  onClick={() => setIsWishlisted(!isWishlisted)}
                >
                  <Heart
                    className={cn("w-5 h-5", isWishlisted && "fill-current")}
                  />
                </Button>
                <Button
                  variant="secondary"
                  size="icon"
                  className="rounded-full bg-white/90 backdrop-blur shadow-lg hover:bg-white"
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Thumbnail Gallery */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((src, i) => (
                  <button
                    key={`${src}-${i}`}
                    type="button"
                    onClick={() => setSelectedImageIndex(i)}
                    className={cn(
                      "relative w-20 h-20 flex-shrink-0 rounded-xl overflow-hidden border-2 transition-all",
                      i === selectedImageIndex
                        ? "border-orange-500 shadow-lg shadow-orange-100"
                        : "border-gray-200 hover:border-orange-300",
                    )}
                  >
                    <Image
                      src={src}
                      alt={`${product.name} thumbnail ${i + 1}`}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Product Info */}
          <div className="space-y-6">
            {/* Category & Rating */}
            <div className="flex items-center gap-4 flex-wrap">
              <Badge
                variant="secondary"
                className="bg-orange-100 text-orange-700 hover:bg-orange-100"
              >
                {product.category.name}
              </Badge>
              <div className="flex items-center gap-2">
                <StarRating rating={5} />
                <span className="text-sm text-gray-600">(156 reviews)</span>
              </div>
            </div>

            {/* Product Name */}
            <h1 className="text-3xl md:text-4xl font-bold text-gray-900 leading-tight">
              {product.name}
            </h1>

            {/* Seller Info */}
            {product.seller && (
              <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-2xl">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white font-bold text-lg shadow-lg">
                  <Store className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900">
                      {product.seller.name}
                    </span>
                    <BadgeCheck className="w-5 h-5 text-blue-500" />
                  </div>
                  <span className="text-sm text-gray-600">
                    Official Store Partner
                  </span>
                </div>
                <Button variant="outline" size="sm" className="rounded-full" asChild>
                  <Link 
                    href={`http://${product.seller.username}.stondemporium.tech`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Visit Store
                  </Link>
                </Button>
              </div>
            )}

            {/* Price Section */}
            <div className="space-y-2">
              <div className="flex items-baseline gap-3">
                <span className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
                  ₹{currentPrice.toLocaleString("en-IN")}
                </span>
                {product.compareAtPrice &&
                  product.compareAtPrice > currentPrice && (
                    <>
                      <span className="text-xl text-gray-400 line-through">
                        ₹{product.compareAtPrice.toLocaleString("en-IN")}
                      </span>
                      <Badge className="bg-green-100 text-green-700 border-0">
                        Save ₹
                        {(product.compareAtPrice - currentPrice).toLocaleString(
                          "en-IN",
                        )}
                      </Badge>
                    </>
                  )}
              </div>
              <p className="text-sm text-gray-500">Inclusive of all taxes</p>
            </div>

            <Separator className="my-6" />

            {/* Variants */}
            {product.variants && product.variants.length > 0 && (
              <VariantSelector
                variants={product.variants}
                selectedVariantId={selectedVariantId}
                onSelect={setSelectedVariantId}
              />
            )}

            {/* Quantity & Add to Cart */}
            <div className="space-y-4">
              <QuantitySelector
                quantity={quantity}
                maxQuantity={currentStock}
                onQuantityChange={setQuantity}
                disabled={isOutOfStock}
              />

              <div className="flex gap-3">
                <AddToCartButton
                  product={product}
                  variantId={selectedVariantId}
                  quantity={quantity}
                  size="lg"
                  className="flex-1 h-14 text-lg rounded-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 shadow-lg shadow-orange-200"
                />
                <Button
                  variant="outline"
                  size="lg"
                  className="h-14 px-8 rounded-full border-2 border-orange-500 text-orange-600 hover:bg-orange-50"
                >
                  Buy Now
                </Button>
              </div>
            </div>

            {/* Trust Badges */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
                  <ShieldCheck className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Secure Checkout
                  </p>
                  <p className="text-xs text-gray-500">100% Protected</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                  <Truck className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Fast Delivery
                  </p>
                  <p className="text-xs text-gray-500">2-5 Business Days</p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-amber-100 flex items-center justify-center">
                  <RotateCcw className="w-5 h-5 text-amber-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Easy Returns
                  </p>
                  <p className="text-xs text-gray-500">
                    {product.refundPolicy || "Contact Care"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-xl">
                <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    24/7 Support
                  </p>
                  <p className="text-xs text-gray-500">Always Available</p>
                </div>
              </div>
            </div>

            {/* SKU & Stock */}
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <span>
                SKU:{" "}
                <span className="font-mono text-gray-700">{currentSku}</span>
              </span>
              <span
                className={cn(
                  "flex items-center gap-1",
                  currentStock > 10
                    ? "text-green-600"
                    : currentStock > 0
                      ? "text-amber-600"
                      : "text-red-600",
                )}
              >
                <span
                  className={cn(
                    "w-2 h-2 rounded-full",
                    currentStock > 10
                      ? "bg-green-500"
                      : currentStock > 0
                        ? "bg-amber-500"
                        : "bg-red-500",
                  )}
                />
                {currentStock > 10
                  ? "In Stock"
                  : currentStock > 0
                    ? `Only ${currentStock} left`
                    : "Out of Stock"}
              </span>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <div className="mt-16">
          <Tabs defaultValue="description" className="w-full">
            <TabsList className="w-full justify-start bg-white border-b rounded-none h-auto p-0 gap-8 overflow-x-auto scrollbar-hide flex-nowrap min-w-full">
              <TabsTrigger
                value="description"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none pb-4 px-0"
              >
                Description
              </TabsTrigger>
              <TabsTrigger
                value="specifications"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none pb-4 px-0"
              >
                Specifications
              </TabsTrigger>
              <TabsTrigger
                value="reviews"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none pb-4 px-0"
              >
                Reviews (156)
              </TabsTrigger>
              <TabsTrigger
                value="shipping"
                className="rounded-none border-b-2 border-transparent data-[state=active]:border-orange-500 data-[state=active]:text-orange-600 data-[state=active]:shadow-none pb-4 px-0"
              >
                Shipping & Returns
              </TabsTrigger>
            </TabsList>

            <TabsContent value="description" className="mt-8">
              <div className="prose prose-gray max-w-none">
                <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">
                    About this product
                  </h3>
                  <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="specifications" className="mt-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">
                  Product Specifications
                </h3>

                {/* Variant attributes if selected */}
                {selectedVariant?.attributes &&
                  selectedVariant.attributes.length > 0 && (
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-orange-600 uppercase tracking-wide mb-3">
                        Selected Variant
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {selectedVariant.attributes.map((attr, idx) => (
                          <div
                            key={idx}
                            className="flex justify-between py-3 border-b border-gray-100"
                          >
                            <span className="text-gray-600">{attr.name}</span>
                            <span className="font-medium text-gray-900">
                              {attr.value}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Category</span>
                    <span className="font-medium text-gray-900">
                      {product.category.name}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">SKU</span>
                    <span className="font-mono text-gray-900">
                      {currentSku}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Availability</span>
                    <span
                      className={cn(
                        "font-medium",
                        currentStock > 0 ? "text-green-600" : "text-red-600",
                      )}
                    >
                      {currentStock > 0 ? "In Stock" : "Out of Stock"}
                    </span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-gray-100">
                    <span className="text-gray-600">Return Policy</span>
                    <span className="font-medium text-gray-900">
                      {product.refundPolicy || "Contact Customer Care"}
                    </span>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="reviews" className="mt-8">
              <ProductReviews productId={product.id} />
            </TabsContent>

            <TabsContent value="shipping" className="mt-8">
              <div className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100">
                <Accordion type="single" collapsible className="w-full">
                  <AccordionItem value="shipping">
                    <AccordionTrigger className="text-lg font-semibold">
                      Shipping Information
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 space-y-3">
                      <p>• Free shipping on orders above ₹499</p>
                      <p>• Standard delivery: 3-5 business days</p>
                      <p>
                        • Express delivery: 1-2 business days (additional
                        charges apply)
                      </p>
                      <p>• We ship to all pin codes across India</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="returns">
                    <AccordionTrigger className="text-lg font-semibold">
                      Return & Refund Policy
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 space-y-3">
                      <p>
                        <strong>Return Window:</strong>{" "}
                        {product.refundPolicy || "Contact Customer Care"}
                      </p>
                      <p>• Items must be unused and in original packaging</p>
                      <p>• Refunds processed within 5-7 business days</p>
                      <p>• Free return pickup for eligible items</p>
                    </AccordionContent>
                  </AccordionItem>
                  <AccordionItem value="warranty">
                    <AccordionTrigger className="text-lg font-semibold">
                      Warranty & Guarantee
                    </AccordionTrigger>
                    <AccordionContent className="text-gray-600 space-y-3">
                      <p>• 100% Authentic products guaranteed</p>
                      <p>• Manufacturer warranty applicable where stated</p>
                      <p>• Contact seller for warranty claims</p>
                    </AccordionContent>
                  </AccordionItem>
                </Accordion>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
