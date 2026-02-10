"use client";

import { useWishlist } from "@/components/products/WishlistContext";
import ProductCard from "@/components/products/ProductCard";
import { Heart, ShoppingBag, ArrowRight } from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";

interface WishlistPageClientProps {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  initialProducts: any[];
}

export default function WishlistPageClient({ initialProducts }: WishlistPageClientProps) {
  const { wishlistIds, isLoading } = useWishlist();

  // Filter products based on current wishlist IDs in context (for real-time updates)
  const products = initialProducts.filter(p => wishlistIds.includes(p.id));

  if (isLoading && products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
        <p className="text-gray-500 font-medium">Loading your favorites...</p>
      </div>
    );
  }

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="w-24 h-24 bg-orange-50 rounded-full flex items-center justify-center mb-6">
          <Heart className="w-12 h-12 text-orange-200" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Your wishlist is empty</h2>
        <p className="text-gray-500 max-w-sm mb-8">
          Save items you love to find them easily later and keep track of price drops.
        </p>
        <Button asChild className="rounded-full px-8 h-12 bg-orange-600 hover:bg-orange-700 shadow-lg shadow-orange-200">
          <Link href="/products" className="flex items-center gap-2">
            Explore Products
            <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
          <p className="text-gray-500 mt-1">{products.length} {products.length === 1 ? 'item' : 'items'} saved</p>
        </div>
        <Button variant="outline" asChild className="rounded-full">
           <Link href="/products" className="flex items-center gap-2">
              <ShoppingBag className="w-4 h-4" />
              Continue Shopping
           </Link>
        </Button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
        <AnimatePresence mode="popLayout">
          {products.map((product) => (
            <motion.div
              key={product.id}
              layout
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              transition={{ duration: 0.2 }}
            >
              <ProductCard product={product} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
