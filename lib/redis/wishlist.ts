import redis, { safeRedisOperation } from './client';
import { RedisKeys } from './keys';
import { REDIS_CONFIG } from './config';
import { logger } from '../logger';

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
      logger.debug({ userId }, "✅ Wishlist cache HIT");
      return cached;
    }

    logger.debug({ userId }, "⚠️ Wishlist cache MISS");

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
    logger.debug({ userId }, "✅ Wishlist cached");

    return wishlist;
  } catch (error) {
    logger.error({ err: error, userId }, 'Redis getWishlist error, falling back to DB');
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
      logger.debug({ userId, productId }, "⚠️ Product already in wishlist");
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
    logger.info({ userId, productId }, "✅ Product added to wishlist (Redis)");

    // Background DB sync (fire and forget)
    syncWishlistToDB(userId).catch(err =>
      logger.error({ err, userId }, 'Background wishlist sync failed')
    );

    return wishlist;
  } catch (error) {
    logger.error({ err: error, userId, productId }, 'Failed to add to wishlist');
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
      logger.debug({ userId }, "⚠️ Wishlist not found");
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
    logger.info({ userId, productId }, "✅ Product removed from wishlist (Redis)");

    // Background DB sync
    syncWishlistToDB(userId).catch(err =>
      logger.error({ err, userId }, 'Background wishlist sync failed')
    );

    return wishlist;
  } catch (error) {
    logger.error({ err: error, userId, productId }, 'Failed to remove from wishlist');
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
    logger.info({ userId }, "✅ Wishlist cleared");

    // Background DB sync
    syncWishlistToDB(userId).catch(err =>
      logger.error({ err, userId }, 'Background wishlist sync failed')
    );
  } catch (error) {
    logger.error({ err: error, userId }, 'Failed to clear wishlist');
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
    logger.error({ err: error, userId, productId }, 'Failed to check wishlist');
    return false;
  }
}

/**
 * Sync wishlist to database (background operation)
 */
async function syncWishlistToDB(
  userId: string
): Promise<void> {
  logger.info({ userId }, "🔄 Syncing wishlist to DB");

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
    logger.info({ userId }, "✅ Wishlist cache invalidated");
  };

  await safeRedisOperation(operation);
}
