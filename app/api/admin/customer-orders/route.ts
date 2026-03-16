/* eslint-disable @typescript-eslint/no-explicit-any */
import { NextRequest, NextResponse } from 'next/server';
import { getPayload } from 'payload';
import config from '@/payload.config';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const payload = await getPayload({ config });
    const { user } = await payload.auth({ headers: request.headers });

    if (!user || (typeof user === 'object' && 'role' in user && user.role !== 'admin')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const type = request.nextUrl.searchParams.get('type') || 'orders';
    const customerId = request.nextUrl.searchParams.get('customerId');

    logger.debug({ type, customerId }, "📦 Admin fetching data");

    if (type === 'summary') {
      const redis = (await import('@/lib/redis/client')).default;
      const { RedisKeys } = await import('@/lib/redis/keys');
      const summaryKey = RedisKeys.adminSummary();
      
      const cached = await redis.get(summaryKey);
      if (cached) return NextResponse.json(cached);

      // Parallel fetching for performance
      const [users, orders, products, feedback, support, leads] = await Promise.all([
        payload.count({ collection: 'users' }),
        payload.find({
          collection: 'orders',
          limit: 1000,
          depth: 0,
          overrideAccess: true,
        }),
        payload.count({
          collection: 'products',
          where: { status: { equals: 'pending' } },
        }),
        payload.count({ collection: 'feedback' }),
        payload.count({ collection: 'support-tickets' as any, where: { status: { equals: 'open' } } }),
        payload.count({ collection: 'leads' as any }),
      ]);

      const totalRevenue = orders.docs.reduce((acc, order: any) => acc + (order.total || 0), 0);
      
      // Generate last 14 days of data for the chart
      const chartData = Array.from({ length: 14 }).map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (13 - i));
        const day = d.toLocaleDateString('en-IN', { weekday: 'short' });
        const dateStr = d.toISOString().split('T')[0];
        
        const dayOrders = orders.docs.filter((o: any) => o.createdAt?.startsWith(dateStr));
        return {
          name: day,
          sales: dayOrders.reduce((acc, o: any) => acc + (o.total || 0), 0),
          users: Math.floor(Math.random() * 20) + 5, // Simulation for UI
          orders: dayOrders.length,
        };
      });

      const summary = {
        totalRevenue,
        totalOrders: orders.totalDocs,
        totalUsers: users,
        pendingProducts: products,
        activeTickets: support,
        feedbackCount: feedback,
        totalLeads: leads,
        chartData,
      };

      await redis.set(summaryKey, summary, { ex: 300 }); // 5 min cache
      return NextResponse.json(summary);
    }

    if (type === 'users') {
      const { docs: users } = await payload.find({
        collection: 'users',
        sort: '-createdAt',
        limit: 1000,
        overrideAccess: true,
      });
      return NextResponse.json({ users });
    }

    if (type === 'sellers') {
      const { docs: sellers } = await payload.find({
        collection: 'sellers',
        sort: '-createdAt',
        limit: 1000,
        depth: 1, // Get owner details
        overrideAccess: true,
      });
      return NextResponse.json({ sellers });
    }

    if (type === 'warehouses') {
      const { docs: warehouses } = await payload.find({
        collection: 'warehouses',
        sort: '-createdAt',
        limit: 1000,
        depth: 1, // Get seller details
        overrideAccess: true,
      });
      return NextResponse.json({ warehouses });
    }

    if (type === 'discounts') {
      const { docs: discounts } = await payload.find({
        collection: 'discount-codes',
        sort: '-createdAt',
        limit: 1000,
        overrideAccess: true,
      });
      return NextResponse.json({ discounts });
    }

    if (type === 'reviews') {
      const { docs: reviews } = await payload.find({
        collection: 'reviews',
        sort: '-createdAt',
        limit: 1000,
        depth: 2, // Get user and product details
        overrideAccess: true,
      });
      return NextResponse.json({ reviews });
    }

    if (type === 'categories') {
      const { docs: categories } = await payload.find({
        collection: 'categories',
        sort: 'name',
        limit: 1000,
        overrideAccess: true,
      });
      return NextResponse.json({ categories });
    }

    if (type === 'feedback') {
      const { docs: feedback } = await payload.find({
        collection: 'feedback',
        sort: '-createdAt',
        limit: 1000,
        overrideAccess: true,
      });
      return NextResponse.json({ feedback });
    }

    // Default: Fetch orders
    const query: any = {};
    if (customerId) {
      query.user = { equals: customerId };
    }

    const { docs: orders } = await payload.find({
      collection: 'orders',
      where: query,
      sort: '-createdAt',
      limit: 1000,
      depth: 1,
      overrideAccess: true,
    });

    return NextResponse.json({
      docs: orders || [],
      total: orders?.length || 0,
      orders: orders || [], // Maintain backward compatibility for some frontend parts
    });
  } catch (error) {
    logger.error({ err: error }, '❌ Failed to fetch admin data');
    return NextResponse.json(
      { error: 'Failed to fetch admin data' },
      { status: 500 }
    );
  }
}
