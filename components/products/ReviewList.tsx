"use client";

import { motion, AnimatePresence } from "framer-motion";
import StarRating from "./StarRating";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, User, MoreVertical, Edit2, Trash2, Loader2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { useState } from "react";
import { deleteReview } from "@/app/(frontend)/products/actions/reviews";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import ReviewForm from "./ReviewForm";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import ImageLightbox from "./ImageLightbox";

interface Review {
  id: string;
  rating: number;
  comment: string;
  createdAt: string;
  isVerified: boolean;
  images: string[];
  user: {
    id: string;
    name: string;
    image?: string | null;
  };
}

interface ReviewListProps {
  reviews: Review[];
  currentUser: {
    userId: string | null;
    role: string | null;
  };
  onRefresh: () => void;
  productId: string;
}

export default function ReviewList({ reviews, currentUser, onRefresh, productId }: ReviewListProps) {
  // Defensive: ensure reviews is always an array
  const safeReviews = reviews ?? [];
  
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxImages, setLightboxImages] = useState<string[]>([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);
  
  // Pagination: Show 5 reviews initially, load 5 more on "View More"
  const REVIEWS_PER_PAGE = 5;
  const [visibleCount, setVisibleCount] = useState(REVIEWS_PER_PAGE);
  
  const visibleReviews = safeReviews.slice(0, visibleCount);
  const hasMore = visibleCount < safeReviews.length;
  const remainingCount = safeReviews.length - visibleCount;

  const openLightbox = (images: string[], index: number) => {
    setLightboxImages(images);
    setLightboxIndex(index);
    setLightboxOpen(true);
  };
  
  const handleViewMore = () => {
    setVisibleCount(prev => Math.min(prev + REVIEWS_PER_PAGE, safeReviews.length));
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this review?")) return;
    
    setDeletingId(id);
    try {
      const res = await deleteReview(id);
      if (res.success) {
        toast.success("Review deleted successfully");
        onRefresh();
      } else {
        toast.error(res.error || "Failed to delete review");
      }
    } catch {
      toast.error("Something went wrong");
    } finally {
      setDeletingId(null);
    }
  };

  if (safeReviews.length === 0) {
    return (
      <div className="text-center py-20 bg-slate-50/50 rounded-[2.5rem] border border-dashed border-slate-200">
        <p className="text-slate-400 font-bold text-sm uppercase tracking-widest">No reviews yet. Be the first to share your thoughts!</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {visibleReviews.map((review, idx) => {
        const isPoster = currentUser.userId === review.user.id;
        const isAdmin = currentUser.role === "admin";
        const canManage = isPoster || isAdmin;

        return (
          <motion.div
            key={review.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.1 }}
            className="bg-white rounded-[2rem] p-6 md:p-8 border border-slate-100 shadow-sm hover:shadow-md transition-shadow relative"
          >
            <AnimatePresence mode="wait">
              {editingId === review.id ? (
                <motion.div
                  key="edit-form"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <ReviewForm 
                    productId={productId} 
                    initialData={{
                      id: review.id,
                      rating: review.rating,
                      comment: review.comment,
                      images: review.images
                    }}
                    onSuccess={() => {
                      setEditingId(null);
                      onRefresh();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </motion.div>
              ) : (
                <motion.div
                  key="content"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  <div className="flex flex-col md:flex-row md:items-start justify-between gap-4 mb-6">
                    <div className="flex items-center gap-4">
                      <div className="h-12 w-12 rounded-full bg-slate-100 flex items-center justify-center overflow-hidden shrink-0 border-2 border-white shadow-sm">
                        {review.user.image ? (
                          <Image src={review.user.image} alt={review.user.name} width={48} height={48} className="object-cover" />
                        ) : (
                          <User className="h-6 w-6 text-slate-400" />
                        )}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-900">{review.user.name}</h4>
                          {review.isVerified && (
                            <Badge variant="secondary" className="bg-emerald-50 text-emerald-600 border-emerald-100 text-[9px] font-black h-5 px-1.5 flex gap-1 items-center">
                              <CheckCircle2 className="h-3 w-3" /> VERIFIED BUYER
                            </Badge>
                          )}
                        </div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                          {formatDistanceToNow(new Date(review.createdAt))} ago
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <StarRating rating={review.rating} size={14} />
                      {canManage && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8 rounded-full">
                              <MoreVertical className="h-4 w-4 text-slate-400" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end" className="rounded-xl border-slate-100 shadow-xl overflow-hidden">
                            <DropdownMenuItem 
                              className="gap-2 font-bold text-[10px] uppercase tracking-widest cursor-pointer py-3"
                              onClick={() => setEditingId(review.id)}
                            >
                              <Edit2 className="h-3 w-3 text-amber-500" /> EDIT REVIEW
                            </DropdownMenuItem>
                            <DropdownMenuItem 
                              className="gap-2 font-bold text-[10px] uppercase tracking-widest text-rose-500 hover:text-rose-600 cursor-pointer py-3"
                              onClick={() => handleDelete(review.id)}
                              disabled={deletingId === review.id}
                            >
                              {deletingId === review.id ? (
                                <Loader2 className="h-3 w-3 animate-spin" />
                              ) : (
                                <Trash2 className="h-3 w-3" />
                              )} 
                              DELETE REVIEW
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                    </div>
                  </div>

                  <p className="text-slate-600 font-medium leading-relaxed mb-6">
                    {review.comment}
                  </p>

                  {review.images.length > 0 && (
                    <div className="flex flex-wrap gap-3">
                      {review.images.map((img, i) => (
                        <button
                          key={i}
                          onClick={() => openLightbox(review.images, i)}
                          className="h-20 w-24 relative rounded-xl overflow-hidden shadow-sm hover:scale-105 hover:shadow-md transition-all cursor-pointer border-2 border-transparent hover:border-orange-300"
                        >
                          <Image 
                            src={img} 
                            alt={`Review photo ${i + 1}`} 
                            fill 
                            className="object-cover"
                            sizes="100px"
                          />
                        </button>
                      ))}
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        );
      })}

      {/* View More Button */}
      {hasMore && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex justify-center pt-4"
        >
          <Button
            onClick={handleViewMore}
            variant="outline"
            size="lg"
            className="rounded-full px-8 py-6 font-bold shadow-sm hover:shadow-md transition-all border-2 border-orange-200 hover:border-orange-400 hover:bg-orange-50"
          >
            View More Reviews ({remainingCount} remaining)
          </Button>
        </motion.div>
      )}

      {/* Image Lightbox */}
      <ImageLightbox
        images={lightboxImages}
        initialIndex={lightboxIndex}
        isOpen={lightboxOpen}
        onClose={() => setLightboxOpen(false)}
      />
    </div>
  );
}
