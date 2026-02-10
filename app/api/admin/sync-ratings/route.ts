import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { revalidatePath } from 'next/cache';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');

    // Check authentication
    const { user } = await payload.auth({ headers: request.headers });
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    if (!user || (user as any).role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (action === 'sync') {
      // Sync all product ratings
      const products = await payload.find({
        collection: 'products',
        where: { status: { equals: 'live' } },
        limit: 1000,
        overrideAccess: true,
      });

      console.log(`🔄 Syncing ${products.totalDocs} products...`);
      const logs: string[] = [];
      const results = [];

      for (const product of products.docs) {
        try {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const reviews = await (payload as any).find({
            collection: 'reviews',
            where: { product: { equals: product.id } },
            limit: 1000,
            overrideAccess: true,
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
          const finalAvg = parseFloat(averageRating.toFixed(1));

          logs.push(`Product: ${product.name} | Reviews: ${reviewCount} | New Rating: ${finalAvg}`);

          await payload.update({
            collection: 'products',
            id: product.id,
            data: {
              reviewCount,
              averageRating: finalAvg,
              ratingDistribution: distribution,
            },
            overrideAccess: true,
          });

          results.push({
            id: product.id,
            name: product.name,
            reviewCount,
            averageRating: finalAvg,
          });
        } catch (err: unknown) {
          console.error(`Error syncing product ${product.id}:`, err);
          logs.push(`❌ Error syncing ${product.name}: ${err instanceof Error ? err.message : 'Unknown error'}`);
        }
      }

      // Revalidate all pages
      revalidatePath('/');
      revalidatePath('/products');

      return NextResponse.json({ 
        success: true, 
        synced: results.length,
        logs,
        products: results 
      });
    }

    // Default: show review stats
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const reviews = await (payload as any).find({
      collection: 'reviews',
      limit: 100,
    });

    const products = await payload.find({
      collection: 'products',
      where: { status: { equals: 'live' } },
      limit: 20,
    });

    return NextResponse.json({
      totalReviews: reviews.totalDocs,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      products: products.docs.map((p: any) => ({
        id: p.id,
        name: p.name,
        reviewCount: p.reviewCount || 0,
        averageRating: p.averageRating || 0,
      })),
    });
  } catch (error: unknown) {
    console.error('Debug API error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
