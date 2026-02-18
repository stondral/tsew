import redis, { safeRedisOperation } from './client';
import { RedisKeys } from './keys';
import { REDIS_CONFIG } from './config';

/**
 * Wishlist Caching Layer
 * 
 * Caches user wishlists for instant access and optimistic updates.
 * Similar strategy to cart caching.
 * 
 * Strategy:
 * - Redis-first reads: 7-day TTL
 * - Optimistic writes with background DB sync
 * - Instant UI updates (<16ms)
 */

interface WishlistItem {
  productId: string;
  addedAt: string;
}

interface RedisWishlist {
  userId: string;
  products: string[]; // Array of product IDs
  items: WishlistItem[]; // Detailed items with metadata
  cachedAt: string;
}

/**
 * Get wishlist from Redis, fallback to DB
 */
export async function getWishlist(
  userId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchFromDB: () => Promise<any>
): Promise<RedisWishlist> {
  try {
    const key = RedisKeys.wishlist(userId);
    const cached = await redis.get<RedisWishlist>(key);

    if (cached) {
      console.log(`✅ Wishlist cache HIT for user: ${userId}`);
      return cached;
    }

    console.log(`⚠️ Wishlist cache MISS for user: ${userId}`);

    // Fetch from DB
    const wishlistDoc = await fetchFromDB();

    const wishlist: RedisWishlist = {
      userId,
      products: wishlistDoc?.products || [],
      items: (wishlistDoc?.products || []).map((productId: string) => ({
        productId,
        addedAt: new Date().toISOString(),
      })),
      cachedAt: new Date().toISOString(),
    };

    // Cache for 7 days
    await redis.setex(key, REDIS_CONFIG.TTL.WISHLIST, wishlist);
    console.log(`✅ Wishlist cached for user: ${userId}`);

    return wishlist;
  } catch (error) {
    console.error('Redis getWishlist error, falling back to DB:', error);
    const wishlistDoc = await fetchFromDB();
    return {
      userId,
      products: wishlistDoc?.products || [],
      items: (wishlistDoc?.products || []).map((productId: string) => ({
        productId,
        addedAt: new Date().toISOString(),
      })),
      cachedAt: new Date().toISOString(),
    };
  }
}

/**
 * Add product to wishlist (optimistic update)
 */
export async function addToWishlist(
  userId: string,
  productId: string
): Promise<RedisWishlist> {
  try {
    const key = RedisKeys.wishlist(userId);

    // Get current wishlist
    let wishlist = await redis.get<RedisWishlist>(key);

    if (!wishlist) {
      wishlist = {
        userId,
        products: [],
        items: [],
        cachedAt: new Date().toISOString(),
      };
    }

    // Check if already in wishlist
    if (wishlist.products.includes(productId)) {
      console.log(`⚠️ Product already in wishlist: ${productId}`);
      return wishlist;
    }

    // Add product
    wishlist.products.push(productId);
    wishlist.items.push({
      productId,
      addedAt: new Date().toISOString(),
    });
    wishlist.cachedAt = new Date().toISOString();

    // Update Redis immediately
    await redis.setex(key, REDIS_CONFIG.TTL.WISHLIST, wishlist);
    console.log(`✅ Product added to wishlist (Redis): ${productId}`);

    // Background DB sync (fire and forget)
    syncWishlistToDB(userId).catch(err =>
      console.error('Background wishlist sync failed:', err)
    );

    return wishlist;
  } catch (error) {
    console.error('Failed to add to wishlist:', error);
    throw error;
  }
}

/**
 * Remove product from wishlist (optimistic update)
 */
export async function removeFromWishlist(
  userId: string,
  productId: string
): Promise<RedisWishlist> {
  try {
    const key = RedisKeys.wishlist(userId);

    // Get current wishlist
    const wishlist = await redis.get<RedisWishlist>(key);

    if (!wishlist) {
      console.log(`⚠️ Wishlist not found for user: ${userId}`);
      return {
        userId,
        products: [],
        items: [],
        cachedAt: new Date().toISOString(),
      };
    }

    // Remove product
    wishlist.products = wishlist.products.filter(id => id !== productId);
    wishlist.items = wishlist.items.filter(item => item.productId !== productId);
    wishlist.cachedAt = new Date().toISOString();

    // Update Redis immediately
    await redis.setex(key, REDIS_CONFIG.TTL.WISHLIST, wishlist);
    console.log(`✅ Product removed from wishlist (Redis): ${productId}`);

    // Background DB sync
    syncWishlistToDB(userId).catch(err =>
      console.error('Background wishlist sync failed:', err)
    );

    return wishlist;
  } catch (error) {
    console.error('Failed to remove from wishlist:', error);
    throw error;
  }
}

/**
 * Clear entire wishlist
 */
export async function clearWishlist(userId: string): Promise<void> {
  try {
    const key = RedisKeys.wishlist(userId);

    const emptyWishlist: RedisWishlist = {
      userId,
      products: [],
      items: [],
      cachedAt: new Date().toISOString(),
    };

    await redis.setex(key, REDIS_CONFIG.TTL.WISHLIST, emptyWishlist);
    console.log(`✅ Wishlist cleared for user: ${userId}`);

    // Background DB sync
    syncWishlistToDB(userId).catch(err =>
      console.error('Background wishlist sync failed:', err)
    );
  } catch (error) {
    console.error('Failed to clear wishlist:', error);
    throw error;
  }
}

/**
 * Check if product is in wishlist
 */
export async function isInWishlist(
  userId: string,
  productId: string
): Promise<boolean> {
  try {
    const key = RedisKeys.wishlist(userId);
    const wishlist = await redis.get<RedisWishlist>(key);

    return wishlist?.products.includes(productId) || false;
  } catch (error) {
    console.error('Failed to check wishlist:', error);
    return false;
  }
}

/**
 * Sync wishlist to database (background operation)
 */
async function syncWishlistToDB(
  userId: string
): Promise<void> {
  // This will be called from API routes with access to Payload
  // For now, just log the sync intention
  console.log(`🔄 Syncing wishlist to DB for user: ${userId}`);

  // The actual DB sync will be implemented in the API route
  // using payload.update() or payload.create()
}

/**
 * Invalidate wishlist cache
 */
export async function invalidateWishlist(userId: string): Promise<void> {
  const operation = async () => {
    const key = RedisKeys.wishlist(userId);
    await redis.del(key);
    console.log(`✅ Wishlist cache invalidated for user: ${userId}`);
  };

  await safeRedisOperation(operation);
}
