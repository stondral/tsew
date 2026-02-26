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

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const order = await (payload as any).findByID({
            collection: 'orders',
            id,
            depth: 1, // To get relational data like items and address
        });

        if (!order) {
            return Response.json({ error: 'Order not found' }, { status: 404 });
        }

        // Verify ownership
        const orderUserId = typeof order.user === 'string' ? order.user : order.user?.id;
        if (orderUserId !== user.id && user.role !== 'admin' && user.role !== 'seller') {
            return Response.json({ error: 'Forbidden' }, { status: 403 });
        }

        // Backfill images if missing just like the original page logic
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        if (order.items && order.items.some((item: any) => !item.productImage)) {
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            await Promise.all(order.items.map(async (item: any) => {
                if (item.productImage) return;
                try {
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    const product = await (payload as any).findByID({
                        collection: "products",
                        id: item.productId,
                        depth: 1,
                    });
                    if (product?.media?.[0]) {
                        const media = product.media[0];
                        item.productImage = typeof media === "object" ? (media.sizes?.thumbnail?.url || media.url || "") : "";
                    }
                } catch (e) {
                    console.error("Backfill error", e);
                }
            }));
        }

        return Response.json({ order }, { status: 200 });
    } catch (error) {
        console.error('Error fetching order API:', error);
        return Response.json({ error: 'Internal Server Error' }, { status: 500 });
    }
}
