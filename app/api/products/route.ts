import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { resolveMediaUrl } from '@/lib/media';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const type = searchParams.get('type');
  const limit = parseInt(searchParams.get('limit') || '16');
  const sellerId = searchParams.get('sellerId');

  try {
    const payload = await getPayload({ config });

    let where: Record<string, unknown> = {
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
    });

    // Transform the data
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const products = data?.docs?.map((p: any) => ({
      id: p.id,
      name: p.name,
      slug: p.slug,
      basePrice: p.basePrice,
      price: (p.price && p.price > 0) ? p.price : p.basePrice,
      compareAtPrice: p.compareAtPrice,
      isActive: p.isActive,
      status: p.status,
      popularity: p.popularity,
      featured: p.featured,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      image: p.media ? resolveMediaUrl(p.media as any) : null,
      images: Array.isArray(p.media)
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ? p.media.map((m: any) => resolveMediaUrl(m))
        : p.media
        ? [resolveMediaUrl(p.media)]
        : [],
      category: {
        name: typeof p.category === 'object' ? p.category.name : (p.category || 'Uncategorized')
      },
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      variants: (p.variants || []).map((v: any) => ({
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        image: v.image ? resolveMediaUrl(v.image as any) : null,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: v.id as any,
        name: v.name,
        sku: v.sku,
        price: v.price,
        stock: v.stock,
        attributes: v.attributes || []
      })),
    })) ?? [];

    return NextResponse.json({ products });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}
