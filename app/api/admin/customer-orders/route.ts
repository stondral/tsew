import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';

export async function GET(request: NextRequest) {
  try {
    const customerId = request.nextUrl.searchParams.get('customerId');

    if (!customerId) {
      return NextResponse.json(
        { error: 'Missing customerId parameter' },
        { status: 400 }
      );
    }

    console.log(`📦 Fetching orders for customer ${customerId}`);

    // Get auth token
    const token = request.cookies.get('payload-token')?.value ||
      request.headers.get('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get Payload instance
    const payloadInstance = await getPayload({ config });

    // Fetch orders for this customer
    const { docs: orders } = await payloadInstance.find({
      collection: 'orders',
      where: {
        user: {
          equals: customerId,
        },
      },
      sort: '-createdAt',
      limit: 20,
      depth: 1,
    });

    console.log(`✅ Found ${orders?.length || 0} orders for customer ${customerId}`);

    return NextResponse.json({
      docs: orders || [],
      total: orders?.length || 0,
    });
  } catch (error) {
    console.error('❌ Failed to fetch customer orders:', error);
    return NextResponse.json(
      { error: 'Failed to fetch customer orders' },
      { status: 500 }
    );
  }
}
