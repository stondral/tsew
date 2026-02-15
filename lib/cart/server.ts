'use server';

import { cookies } from 'next/headers';
import type { CartClient } from '@/components/cart/cart.types';
import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

interface PayloadCartItem {
  product: string | { id: string };
  variantId?: string;
  quantity: number;
}

/**
 * Server-side cart fetcher
 * Fetches cart from database on server to avoid client-side API calls
 */
export async function getServerCart(): Promise<CartClient> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('payload-token')?.value;
    
    if (!token) {
      // No auth token = guest user
      return { items: [] };
    }
    
    // Fetch user's cart from database
    const { getPayload } = await import('payload');
    const { default: config } = await import('@/payload.config');
    const payload = await getPayload({ config });
    
    // Get current user
    const { user } = await payload.auth({ headers: cookieStore as unknown as Headers | ReadonlyHeaders });
    
    if (!user) {
      return { items: [] };
    }
    
    // Fetch cart from database
    const carts = await payload.find({
      collection: 'carts',
      where: {
        user: { equals: user.id },
      },
      limit: 1,
    });
    
    const cart = carts.docs[0];
    
    if (!cart || !cart.items) {
      return { items: [] };
    }
    
    // Transform to CartClient format
    return {
      items: (cart.items as PayloadCartItem[]).map((item) => ({
        productId: typeof item.product === 'string' ? item.product : item.product?.id,
        variantId: item.variantId || null,
        quantity: item.quantity || 1,
      })),
    };
  } catch (error) {
    console.error('[Server] Error fetching cart:', error);
    return { items: [] };
  }
}
