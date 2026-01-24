"use client";

import { useState } from "react";
import { Star, ThumbsUp, MessageCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface Review {
  id: string;
  author: string;
  rating: number;
  date: string;
  title: string;
  content: string;
  helpful: number;
  verified: boolean;
}

// Mock reviews - in production, fetch from API
const mockReviews: Review[] = [
  {
    id: "1",
    author: "Priya S.",
    rating: 5,
    date: "2 days ago",
    title: "Absolutely love it!",
    content: "Excellent quality product. Exactly as described and arrived quickly. The packaging was also very secure. Would definitely recommend to others!",
    helpful: 24,
    verified: true,
  },
  {
    id: "2",
    author: "Rahul M.",
    rating: 4,
    date: "1 week ago",
    title: "Great value for money",
    content: "Good product overall. Minor issue with the packaging but the product itself is fantastic. Customer service was helpful in resolving my query.",
    helpful: 12,
    verified: true,
  },
  {
    id: "3",
    author: "Anjali K.",
    rating: 5,
    date: "2 weeks ago",
    title: "Perfect gift!",
    content: "Bought this as a gift and the recipient loved it. The quality exceeded my expectations. Will be ordering more for myself!",
    helpful: 8,
    verified: false,
  },
];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" | "lg" }) {
  const sizeClasses = {
    sm: "w-4 h-4",
    md: "w-5 h-5",
    lg: "w-6 h-6",
  };

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={cn(
            sizeClasses[size],
            star <= rating
              ? "fill-amber-400 text-amber-400"
              : "fill-gray-200 text-gray-200"
          )}
        />
      ))}
    </div>
  );
}

function RatingBar({ stars, count, total }: { stars: number; count: number; total: number }) {
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="w-8 text-gray-600">{stars}★</span>
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all duration-500"
          style={{ width: `${percentage}%` }}
        />
      </div>
      <span className="w-8 text-gray-500 text-right">{count}</span>
    </div>
  );
}

export default function ProductReviews({ productId: _productId }: { productId: string }) {
  const [helpfulClicked, setHelpfulClicked] = useState<Set<string>>(new Set());

  // productId can be used for fetching reviews from API
  void _productId;

  // Mock stats - in production, fetch from API
  const averageRating = 4.7;
  const totalReviews = 156;
  const ratingDistribution = { 5: 98, 4: 38, 3: 12, 2: 5, 1: 3 };

  const handleHelpful = (reviewId: string) => {
    setHelpfulClicked((prev) => new Set(prev).add(reviewId));
  };

  return (
    <div className="space-y-8">
      {/* Rating Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-6 bg-gradient-to-br from-orange-50 to-amber-50 rounded-2xl">
        {/* Average Rating */}
        <div className="flex flex-col items-center justify-center text-center space-y-3">
          <div className="text-6xl font-bold bg-gradient-to-r from-orange-600 to-amber-500 bg-clip-text text-transparent">
            {averageRating}
          </div>
          <StarRating rating={Math.round(averageRating)} size="lg" />
          <p className="text-gray-600">Based on {totalReviews} reviews</p>
        </div>

        {/* Rating Distribution */}
        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((stars) => (
            <RatingBar
              key={stars}
              stars={stars}
              count={ratingDistribution[stars as keyof typeof ratingDistribution]}
              total={totalReviews}
            />
          ))}
        </div>
      </div>

      {/* Write Review Button */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900">Customer Reviews</h3>
        <Button className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white rounded-full px-6">
          <MessageCircle className="w-4 h-4 mr-2" />
          Write a Review
        </Button>
      </div>

      {/* Reviews List */}
      <div className="space-y-6">
        {mockReviews.map((review) => (
          <div
            key={review.id}
            className="p-6 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white font-semibold">
                  {review.author[0]}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">{review.author}</span>
                    {review.verified && (
                      <span className="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-green-100 text-green-700 rounded-full">
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path
                            fillRule="evenodd"
                            d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                            clipRule="evenodd"
                          />
                        </svg>
                        Verified
                      </span>
                    )}
                  </div>
                  <span className="text-sm text-gray-500">{review.date}</span>
                </div>
              </div>
              <StarRating rating={review.rating} />
            </div>

            <h4 className="font-semibold text-gray-900 mb-2">{review.title}</h4>
            <p className="text-gray-600 leading-relaxed mb-4">{review.content}</p>

            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  "text-gray-500 hover:text-orange-600",
                  helpfulClicked.has(review.id) && "text-orange-600"
                )}
                onClick={() => handleHelpful(review.id)}
                disabled={helpfulClicked.has(review.id)}
              >
                <ThumbsUp className="w-4 h-4 mr-1" />
                Helpful ({helpfulClicked.has(review.id) ? review.helpful + 1 : review.helpful})
              </Button>
            </div>
          </div>
        ))}
      </div>

      {/* Load More */}
      <div className="text-center">
        <Button variant="outline" className="rounded-full px-8 border-orange-200 text-orange-600 hover:bg-orange-50">
          Load More Reviews
        </Button>
      </div>
    </div>
  );
}
