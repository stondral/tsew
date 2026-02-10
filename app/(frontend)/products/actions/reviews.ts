"use server";

import { getPayload } from "payload";
import config from "@/payload.config";
import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { getEmailTemplate } from "@/lib/email-templates";

export async function checkCanReview(productId: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) return { canReview: false, userId: null, role: null, reason: "Please login to write a review." };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const role = (user as any).role;

  // 1. Check if user already reviewed this product
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const existingReviews = await (payload as any).find({
    collection: "reviews",
    where: {
      user: { equals: user.id },
      product: { equals: productId },
    },
    limit: 1,
  });

  if (existingReviews.totalDocs > 0) {
    return { canReview: false, userId: user.id, role, reason: "You have already reviewed this product." };
  }

  // 2. Check if user purchased this product and it was delivered
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const orders = await (payload as any).find({
    collection: "orders",
    where: {
      user: { equals: user.id },
      "items.productId": { equals: productId },
    },
    limit: 100, // Check recent history
  });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const hasDeliveredItem = orders.docs.some((order: any) => 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    order.items.some((item: any) => 
      item.productId === productId && 
      (item.status === "DELIVERED" || order.status === "DELIVERED")
    )
  );

  if (!hasDeliveredItem) {
    return { canReview: false, userId: user.id, role, reason: "Reviews are only available for verified purchasers after delivery." };
  }

  return { canReview: true, userId: user.id, role };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function updateProductStats(productId: string, payload: any) {
  const reviews = await payload.find({
    collection: "reviews",
    where: {
      product: { equals: productId },
    },
    limit: 1000,
  });

  const reviewCount = reviews.totalDocs;
  let totalRating = 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  reviews.docs.forEach((r: any) => {
    const rating = Math.round(r.rating || 0);
    totalRating += r.rating || 0;
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof typeof distribution]++;
    }
  });

  const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

  await payload.update({
    collection: "products",
    id: productId,
    data: {
      reviewCount,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingDistribution: distribution,
    },
    overrideAccess: true,
  });

  const product = await payload.findByID({
     collection: "products",
     id: productId,
     depth: 0,
  });

  revalidatePath(`/products/${product.slug}`);
  revalidatePath("/");
}

export async function submitReview(data: {
  productId: string;
  rating: number;
  comment: string;
  images?: string[];
}) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) return { success: false, error: "Authentication required" };

  const canReview = await checkCanReview(data.productId);
  if (!canReview.canReview) return { success: false, error: canReview.reason };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const review = await (payload as any).create({
      collection: "reviews",
      data: {
        user: user.id,
        product: data.productId,
        rating: data.rating,
        comment: data.comment,
        images: data.images || [],
        isVerified: true,
      },
    });

    await updateProductStats(data.productId, payload);

    // Send confirmation email
    try {
      const product = await payload.findByID({
        collection: "products",
        id: data.productId,
      });

      const userDoc = await payload.findByID({
        collection: "users",
        id: user.id,
      });

      const productUrl = `${process.env.NEXT_PUBLIC_PAYLOAD_URL || 'http://localhost:3000'}/products/${product.slug}#reviews`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const customerName = (userDoc as any).username || (userDoc as any).email?.split('@')[0] || 'Valued Customer';

      const emailHtml = getEmailTemplate('review-confirmation', {
        customerName,
        productName: product.name,
        rating: data.rating.toString(),
        ratingStars: '⭐'.repeat(data.rating),
        reviewText: data.comment,
        productUrl,
      });

      await payload.sendEmail({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        to: (userDoc as any).email,
        subject: "Thank You for Your Review! 🌟",
        html: emailHtml,
      });

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      console.log(`📧 Review confirmation email sent to ${(userDoc as any).email}`);
    } catch (emailError) {
      console.error("Failed to send review confirmation email:", emailError);
      // Don't fail the review submission if email fails
    }

    return { success: true, review };
  } catch (error: unknown) {
    console.error("Review submission error:", error);
    return { success: false, error: error instanceof Error ? error.message : "Failed to submit review" };
  }
}

export async function updateReview(reviewId: string, data: {
  rating: number;
  comment: string;
  images?: string[];
}) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) return { success: false, error: "Authentication required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const review = await (payload as any).findByID({
    collection: "reviews",
    id: reviewId,
  });

  if (!review) return { success: false, error: "Review not found" };

  const userId = typeof review.user === 'object' ? review.user.id : review.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (user as any).role === 'admin';

  if (userId !== user.id && !isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const updatedReview = await (payload as any).update({
      collection: "reviews",
      id: reviewId,
      data: {
        rating: data.rating,
        comment: data.comment,
        images: data.images || [],
      },
    });

    await updateProductStats(typeof review.product === 'object' ? review.product.id : review.product, payload);
    return { success: true, review: updatedReview };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to update review" };
  }
}

export async function deleteReview(reviewId: string) {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  
  const { user } = await payload.auth({
    headers: requestHeaders
  });

  if (!user) return { success: false, error: "Authentication required" };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const review = await (payload as any).findByID({
    collection: "reviews",
    id: reviewId,
  });

  if (!review) return { success: false, error: "Review not found" };

  const userId = typeof review.user === 'object' ? review.user.id : review.user;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const isAdmin = (user as any).role === 'admin';

  if (userId !== user.id && !isAdmin) {
    return { success: false, error: "Unauthorized" };
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    await (payload as any).delete({
      collection: "reviews",
      id: reviewId,
    });

    await updateProductStats(typeof review.product === 'object' ? review.product.id : review.product, payload);
    return { success: true };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : "Failed to delete review" };
  }
}

export async function getReviews(productId: string) {
  const payload = await getPayload({ config });
  
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const reviews = await (payload as any).find({
    collection: "reviews",
    where: {
      product: { equals: productId },
    },
    sort: "-createdAt",
    depth: 2,
    limit: 50,
  });

  return {
    success: true,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    reviews: reviews.docs.map((r: any) => ({
      id: r.id,
      rating: r.rating,
      comment: r.comment,
      createdAt: r.createdAt,
      isVerified: r.isVerified,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      images: (r.images || []).map((img: any) => typeof img === 'object' ? img.url : img),
      user: {
        id: typeof r.user === 'object' ? r.user.id : r.user,
        name: r.user?.username || r.user?.email?.split('@')[0] || "Anonymous",
        image: r.user?.image?.url || null,
      }
    })),
  };
}

export async function syncAllProductRatings() {
  const payload = await getPayload({ config });
  const requestHeaders = await headers();
  const { user } = await payload.auth({ headers: requestHeaders });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  if (!user || (user as any).role !== "admin") {
    return { success: false, error: "Unauthorized" };
  }

  try {
    const products = await payload.find({
      collection: "products",
      where: {
        status: { equals: "live" },
      },
      limit: 1000,
      overrideAccess: true,
    });

    console.log(`🔄 Syncing ratings for ${products.docs.length} products...`);

    for (const product of products.docs) {
      await updateProductStats(product.id, payload);
    }

    return { success: true, count: products.docs.length };
  } catch (error: unknown) {
    console.error("Sync error:", error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
