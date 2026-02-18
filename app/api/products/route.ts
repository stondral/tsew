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

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const data = await (payload as any).find({
      collection: 'products',
      where,
      limit,
      depth: 2,
      overrideAccess: true,
    });

    // Transform the data using shared mapper
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = data?.docs?.map((p: any) => mapPayloadProductToDomain(p)) ?? [];

    return NextResponse.json({ products });
  } catch (error) {
    logger.error({ err: error, type, sellerId }, 'Error fetching products');
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
