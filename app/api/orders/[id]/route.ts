import { getPayload } from 'payload';
import config from '@/payload.config';
import { headers } from 'next/headers';

export async function GET(
    req: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await params;
        const requestHeaders = await headers();
        const payload = await getPayload({ config });

        // Check auth
        const { user } = await payload.auth({ headers: requestHeaders });

        if (!user) {
            return Response.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { getOrderDetail } = await import("@/lib/redis/order");

        const order = await getOrderDetail(id, async () => {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            return await (payload as any).findByID({
                collection: 'orders',
                id,
                depth: 1,
            });
        });

        if (!order) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify ownership
        const orderUserId = typeof order.user === 'string' ? order.user : order.user?.id;
        if (orderUserId !== user.id && user.role !== 'admin' && user.role !== 'seller') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        return Response.json({ order }, { status: 200 });
    } catch (error) {
        console.error('Error fetching order API:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
