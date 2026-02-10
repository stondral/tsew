import { CollectionAfterChangeHook, CollectionAfterDeleteHook } from 'payload';
import { revalidatePath } from 'next/cache';

export const updateProductStatsAfterChange: CollectionAfterChangeHook = async ({
  doc,
  req: { payload },
  operation,
}) => {
  const productId = typeof doc.product === 'object' ? doc.product.id : doc.product;
  await updateStats(productId, payload);
};

export const updateProductStatsAfterDelete: CollectionAfterDeleteHook = async ({
  doc,
  req: { payload },
}) => {
  const productId = typeof doc.product === 'object' ? doc.product.id : doc.product;
  await updateStats(productId, payload);
};

async function updateStats(productId: string, payload: any) {
  const reviews = await payload.find({
    collection: 'reviews',
    where: {
      product: { equals: productId },
    },
    limit: 1000,
  });

  const reviewCount = reviews.totalDocs;
  let totalRating = 0;
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  reviews.docs.forEach((r: any) => {
    const rating = Math.round(r.rating || 0);
    totalRating += r.rating || 0;
    if (rating >= 1 && rating <= 5) {
      distribution[rating as keyof typeof distribution]++;
    }
  });

  const averageRating = reviewCount > 0 ? totalRating / reviewCount : 0;

  const product = await payload.update({
    collection: 'products',
    id: productId,
    data: {
      reviewCount,
      averageRating: parseFloat(averageRating.toFixed(1)),
      ratingDistribution: distribution,
    },
    overrideAccess: true,
  });

  // Revalidate Next.js cache
  try {
     revalidatePath(`/products/${product.slug}`);
     revalidatePath('/');
  } catch (err) {
     // revalidatePath might fail if not called from a request context in some versions of Next,
     // but in the App Router it usually works at runtime.
     console.error('Revalidation error in hook:', err);
  }
}
