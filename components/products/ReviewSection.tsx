"use client";

import { useState, useEffect, useCallback } from "react";
import ReviewForm from "./ReviewForm";
import ReviewList from "./ReviewList";
import { getReviews, checkCanReview, syncAllProductRatings } from "@/app/(frontend)/products/actions/reviews";
import { motion } from "framer-motion";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { RefreshCcw } from "lucide-react";

interface ReviewSectionProps {
  productId: string;
}

export default function ReviewSection({ productId }: ReviewSectionProps) {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [reviews, setReviews] = useState<any[]>([]);
  const [canReview, setCanReview] = useState(false);
  const [userContext, setUserContext] = useState<{ userId: string | null; role: string | null }>({ userId: null, role: null });
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    try {
      const [reviewsRes, canReviewRes] = await Promise.all([
        getReviews(productId),
        checkCanReview(productId)
      ]);
      
      if (reviewsRes.success) {
        setReviews(reviewsRes.reviews);
      }
      setCanReview(canReviewRes.canReview);
      setUserContext({ userId: canReviewRes.userId || null, role: canReviewRes.role || null });
      
      // Refresh router to update product stats in parent components
      router.refresh();
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setLoading(false);
    }
  }, [productId, router]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const handleSync = async () => {
    const promise = syncAllProductRatings();
    toast.promise(promise, {
      loading: "Syncing all product ratings...",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      success: (res: any) => {
        if (res.success) {
          fetchReviews();
          return `Successfully synced ${res.count} products!`;
        }
        throw new Error(res.error);
      },
      error: (err) => `Sync failed: ${err.message}`,
    });
  };

  return (
    <section id="reviews" className="py-20">
      <div className="flex justify-end mb-4">
        {userContext.role === "admin" && (
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleSync}
            className="flex items-center gap-2 text-slate-500 hover:text-amber-600 border-slate-200 rounded-full"
          >
            <RefreshCcw className="w-4 h-4" />
            Sync All Ratings
          </Button>
        )}
      </div>
      <div className="grid lg:grid-cols-12 gap-16">
        <div className="lg:col-span-5 space-y-12">
          <div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 tracking-tight">Customer <span className="text-amber-500">Voices</span></h2>
            <p className="text-slate-500 font-medium text-lg leading-relaxed">
              Discover honest feedback from verified owners who share your passion for fine craftsmanship.
            </p>
          </div>

          {!loading && canReview && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
            >
              <ReviewForm productId={productId} onSuccess={fetchReviews} />
            </motion.div>
          )}

          {!loading && !canReview && !userContext.userId && (
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100/50">
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-loose">
                  Please <Link href="/auth" className="text-amber-600 hover:underline">login</Link> to share your review.
               </p>
            </div>
          )}

          {!loading && !canReview && userContext.userId && (
            <div className="p-8 bg-slate-50 rounded-[2.5rem] border border-slate-100/50">
               <p className="text-slate-400 font-bold text-xs uppercase tracking-widest leading-loose">
                  Reviews are reserved for verified purchasers. Once your order is delivered, you&apos;ll be able to share your story.
               </p>
            </div>
          )}
        </div>

        <div className="lg:col-span-7">
          <div className="flex items-center justify-between mb-10">
            <h3 className="text-xl font-black text-slate-900 uppercase tracking-widest">
              Latest Reviews <span className="text-slate-300 ml-2">[{reviews.length}]</span>
            </h3>
          </div>
          
          {loading ? (
            <div className="space-y-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-48 w-full bg-slate-100 animate-pulse rounded-[2rem]" />
              ))}
            </div>
          ) : (
            <ReviewList reviews={reviews} currentUser={userContext} onRefresh={fetchReviews} productId={productId} />
          )}
        </div>
      </div>
    </section>
  );
}
