import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400 }
      );
    }

    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });

    if (!user || (typeof user === 'object' && 'role' in user && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logger.debug({ customerId }, "📦 Fetching orders for customer");

    // Fetch orders for this customer
    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: {
        user: {
          equals: customerId,
        },
      },
      sort: '-createdAt',
      limit: 20,
      depth: 1,
      overrideAccess: true,
    });

    logger.info({ customerId, orderCount: orders?.length || 0 }, "✅ Found customer orders");

    return NextResponse.json({
      docs: orders || [],
      total: orders?.length || 0,
    });
  } catch (error) {
    logger.error({ err: error, customerId: request.nextUrl.searchParams.get('customerId') }, '❌ Failed to fetch customer orders');
    return NextResponse.json(
      { error: 'Failed to fetch customer orders' },
      { status: 500 }
    );
  }
}
