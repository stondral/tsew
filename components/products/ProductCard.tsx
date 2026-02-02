"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { Heart, Star } from "lucide-react";
import { useState, useRef } from "react";
import { Product } from "@/lib/models/domain/product";
import { Badge } from "@/components/ui/badge";
import AddToCartButton from "@/components/cart/AddToCartButton";
import { resolveMediaUrl } from "@/lib/media";

interface Props {
  product: Product & {
    featured?: boolean;
  };
  view?: "grid" | "list";
  priority?: boolean;
}

export default function ProductCard({ product, view = "grid", priority = false }: Props) {
  const [wishlisted, setWishlisted] = useState(false);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(
    product.variants?.[0]?.id ?? null,
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  const selectedVariant =
    product.variants?.find((v) => v.id === selectedVariantId) ||
    product.variants?.[0];

  const currentPrice = selectedVariant?.price || product.price || 0;
  const images = product.images && product.images.length > 0 ? product.images : [selectedVariant?.image || ""];

  const isList = view === "list";

  return (
    <>
      {/* CARD */}
      <motion.div
        whileHover={{ y: isList ? 0 : -3 }}
        className={`relative bg-card rounded-xl border-2 shadow-lg transition-all duration-300 overflow-hidden w-full h-full flex ${
          isList ? "flex-row gap-4 p-2 h-auto" : "flex-col"
        } ${
          product.featured
            ? "border-orange-400 shadow-orange-200/40"
            : "border-gray-200 hover:border-orange-300 hover:shadow-xl"
        }`}
      >
        {/* IMAGE CAROUSEL */}
        <div className={`relative ${isList ? "w-32 sm:w-48 aspect-square rounded-lg shrink-0" : "aspect-[3/4]"} bg-muted overflow-hidden group/card`}>
          <div 
            ref={scrollRef}
            className="flex overflow-x-auto snap-x snap-mandatory scrollbar-hide h-full"
            style={{ scrollBehavior: 'smooth' }}
          >
            {images.map((img, i) => (
              <Link 
                key={i} 
                href={`/products/${product.slug}`}
                className="relative min-w-full h-full snap-start"
              >
                <Image
                  src={resolveMediaUrl(img)}
                  alt={`${product.name} - image ${i + 1}`}
                  fill
                  className="object-cover"
                  sizes={isList ? "(max-width: 640px) 128px, 192px" : "(max-width: 768px) 50vw, (max-width: 1024px) 33vw, 25vw"}
                  priority={priority && i === 0}
                />
              </Link>
            ))}
          </div>

          {/* DOTS INDICATOR (Only if multiple images) */}
          {images.length > 1 && (
            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1 z-10">
              {images.map((_, i) => (
                <div 
                  key={i} 
                  className="w-1.5 h-1.5 rounded-full bg-white/50 backdrop-blur shadow-sm"
                />
              ))}
            </div>
          )}

          {/* BADGES */}
          <div className="absolute top-2 left-2 flex flex-col gap-1 z-10">
            {product.featured && (
              <Badge className="bg-orange-500 text-white text-[9px] font-bold tracking-wide px-1.5 py-0.5 min-h-0">
                FEATURED
              </Badge>
            )}

            {product.compareAtPrice && (
              <Badge variant="secondary" className="text-[9px] font-semibold px-1.5 py-0.5 min-h-0">
                {Math.round(
                  ((product.compareAtPrice - currentPrice) /
                    product.compareAtPrice) *
                    100,
                )}
                % OFF
              </Badge>
            )}
          </div>


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

        {/* INFO SECTION */}
        <div className={`p-3 flex-1 flex flex-col ${isList ? "gap-1" : "gap-2"}`}>

          <div className="flex-1">
            <Link href={`/products/${product.slug}`} className="block group/title">
              <p className="text-[10px] uppercase text-orange-600/70 font-bold tracking-wider mb-0.5">
                {product.category.name}
              </p>
              <h3 className={`${isList ? "text-base" : "text-sm"} font-bold leading-tight line-clamp-2 text-gray-800 group-hover/title:text-orange-600 transition-colors`}>
                {product.name}
              </h3>
              {isList && (
                <p className="hidden sm:block text-xs text-muted-foreground mt-2 line-clamp-2">
                  {product.description}
                </p>
              )}
            </Link>
          </div>

          {/* VARIANTS */}
          {product.variants && product.variants.length > 1 && (
            <div className={`flex gap-1.5 flex-wrap ${isList ? "my-1" : ""}`}>
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

          {/* PRICE AND ACTION ROW */}
          <div className={`flex ${isList ? "flex-row justify-between items-center" : "flex-col gap-2"} mt-auto pt-2 border-t border-gray-50`}>
            <div className="flex justify-between items-end flex-1 mr-4">
              <div>
                <p className={`font-bold ${isList ? "text-xl" : "text-base"} text-orange-600`}>
                  ₹{currentPrice.toLocaleString()}
                </p>
                {product.compareAtPrice && (
                  <p className="text-[10px] line-through text-muted-foreground">
                    ₹{product.compareAtPrice.toLocaleString()}
                  </p>
                )}
              </div>
              {!isList && (
                <div className="flex items-center gap-1 text-[11px] text-gray-500 font-medium">
                  <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                  {product.popularity}
                </div>
              )}
            </div>

            {/* DESKTOP/TABLET ADD BUTTON */}
            <div className={`${isList ? "w-40" : "mt-1"}`}>
              <AddToCartButton
                product={product}
                variantId={selectedVariantId}
                className="w-full rounded-xl shadow-sm border border-orange-100 hover:shadow-md transition-all font-bold text-xs py-2.5"
              />
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
}
