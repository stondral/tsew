import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { mapPayloadProductToDomain } from '@/lib/products';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '16');
  const sellerId = searchParams.get('sellerId');

  try {
    const payload = await getPayload({ config });

    const where: Record<string, unknown> = {
      status: { equals: 'live' },
      isActive: { equals: true },
    };

    // Handle different query types
    if (type === 'featured') {
      where.featured = { equals: true };
    } else if (type === 'seller' && sellerId) {
      where.seller = { equals: sellerId };
    }

    // Use Redis caching layer
    const { getProductList } = await import('@/lib/redis/product');

    // Define category proxy for the cache key
    const category = type === 'featured' ? 'featured' : (type === 'seller' ? `seller-${sellerId}` : 'all');

    const result = await getProductList(
      category,
      1, // default page
      { limit: limit.toString() },
      async () => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await (payload as any).find({
          collection: 'products',
          where,
          limit,
          depth: 1, // Reduced depth for list view performance
          overrideAccess: true,
        });

        return {
          docs: data?.docs?.map((p: unknown) => mapPayloadProductToDomain(p)) ?? [],
          totalDocs: data?.totalDocs || 0,
          totalPages: data?.totalPages || 0,
          page: data?.page || 1,
        };
      }
    );

    const products = result?.products || [];

    return NextResponse.json({ products });
  } catch (error) {
    logger.error({ err: error, type, sellerId }, 'Error fetching products');
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
