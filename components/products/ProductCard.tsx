"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, Star, ZoomIn } from "lucide-react";
import { useState } from "react";
import { Product } from "@/lib/models/domain/product";
import { Badge } from "@/components/ui/badge";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { resolveMediaUrl } from "@/lib/media";

interface Props {
  product: Product & {
    featured?: boolean; // ✅ OPTIONAL FEATURED FLAG
  };
}

export default function ProductCard({ product }: Props) {
  const [wishlisted, setWishlisted] = useState(false);
  const [zoomOpen, setZoomOpen] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id ?? null,
  );

  const selectedVariant =
    product.variants?.find((v) => v.id === selectedVariantId) ||
    product.variants?.[0];

  const currentImage = selectedVariant?.image || product.images?.[0];
  const currentPrice = selectedVariant?.price || product.price || 0;

  return (
    <>
      {/* CARD */}
      <motion.div
        whileHover={{ y: -3 }}
        className={`relative bg-card rounded-xl border-2 shadow-lg transition-all duration-300 overflow-hidden w-full h-full flex flex-col ${
          product.featured
            ? "border-orange-400 shadow-orange-200/40"
            : "border-gray-200 hover:border-orange-300 hover:shadow-xl"
        }`}
      >
        {/* IMAGE */}
        <div
          className="relative aspect-[3/4] bg-muted overflow-hidden"
          onClick={() => setZoomOpen(true)}
        >
          <Link href={`/products/${product.slug}`}>
            <Image
              src={resolveMediaUrl(currentImage)}
              alt={product.name}
              fill
              className="object-cover"
              unoptimized
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setZoomOpen(true);
              }}
            />
          </Link>

          {/* BADGES */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.featured && (
              <Badge className="bg-orange-500 text-white text-xs font-bold tracking-wide px-2.5 py-1">
                FEATURED
              </Badge>
            )}

            {product.compareAtPrice && (
              <Badge variant="secondary" className="text-xs font-semibold px-2.5 py-1">
                {Math.round(
                  ((product.compareAtPrice - currentPrice) /
                    product.compareAtPrice) *
                    100,
                )}
                % OFF
              </Badge>
            )}
          </div>

          {/* ZOOM ICON */}
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setZoomOpen(true);
            }}
            className="absolute bottom-2 left-2 bg-black/60 text-white p-1.5 rounded-full"
          >
            <ZoomIn size={14} />
          </button>

          {/* WISHLIST */}
          <motion.button
            whileTap={{ scale: 0.8 }}
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setWishlisted(!wishlisted);
            }}
            className="absolute top-2 right-2 bg-white rounded-full p-1.5 shadow"
          >
            <motion.div
              animate={{ scale: wishlisted ? 1.3 : 1 }}
              transition={{ type: "spring" }}
            >
              <Heart
                size={16}
                className={wishlisted ? "fill-red-500 text-red-500" : ""}
              />
            </motion.div>
          </motion.button>
        </div>

        {/* INFO */}
        <div className="p-3 space-y-2 flex-1 flex flex-col">
          <Link href={`/products/${product.slug}`}>
            <p className="text-[10px] uppercase text-muted-foreground">
              {product.category.name}
            </p>

            <h3 className="text-sm font-semibold leading-tight line-clamp-2">
              {product.name}
            </h3>
          </Link>

          <div className="flex items-center gap-1 text-xs">
            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
            {product.popularity}
          </div>

          {/* VARIANTS */}
          {product.variants && product.variants.length > 1 && (
            <div className="flex gap-1.5 flex-wrap">
              {product.variants.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setSelectedVariantId(v.id)}
                  className={`px-2.5 py-1 text-xs font-bold rounded-full border-2 transition-all ${
                    selectedVariantId === v.id
                      ? "bg-black text-white border-black"
                      : "bg-white text-black border-gray-400 hover:border-black"
                  }`}
                  style={{ color: selectedVariantId === v.id ? 'white' : 'black' }}
                >
                  {v.name || 'Variant'}
                </button>
              ))}
            </div>
          )}

          {/* PRICE ROW */}
          <div className="flex justify-between items-center mt-2">
            <div>
              <p className="font-bold text-sm">
                ₹{currentPrice.toLocaleString()}
              </p>
              {product.compareAtPrice && (
                <p className="text-[10px] line-through text-muted-foreground">
                  ₹{product.compareAtPrice.toLocaleString()}
                </p>
              )}
            </div>

            {/* DESKTOP ADD */}
            <div className="hidden md:block">
              <AddToCartButton
                product={product}
                variantId={selectedVariantId}
                size="sm"
              />
            </div>
          </div>
        </div>

        {/* MOBILE ADD TO CART (REPLACING QUICK ADD) */}
        <div className="md:hidden mt-auto">
          <AddToCartButton
            product={product}
            variantId={selectedVariantId}
            className="w-full rounded-none py-3"
          />
        </div>
      </motion.div>

      {/* QUICK ADD BOTTOM SHEET REMOVED */}

      {/* IMAGE ZOOM MODAL */}
      <AnimatePresence>
        {zoomOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center"
            onClick={() => setZoomOpen(false)}
          >
            <motion.img
              src={resolveMediaUrl(currentImage)}
              className="max-h-[90vh] rounded-xl"
            />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
