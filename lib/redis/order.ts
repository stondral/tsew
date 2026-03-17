import redis, { safeRedisOperation } from './client';
import { RedisKeys } from './keys';
import { REDIS_CONFIG } from './config';
import { logger } from '../logger';

/**
 * Order Caching Layer
 * 
 * Strategy:
 * - Order Lists: 2-minute TTL (Short because orders change state)
 * - Order Details: 5-minute TTL
 */

export async function getUserOrders(
  userId: string,
  page = 1,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchFromDB: () => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  if (!REDIS_CONFIG.FEATURES.PRODUCT_CACHING) { // Reusing product caching flag for simplicity or add a new one
    return await fetchFromDB();
  }

  try {
    const key = RedisKeys.userOrders(userId, page);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = await redis.get<any>(key);

    if (cached) {
      logger.debug({ userId }, "✅ Orders list cache HIT");
      return cached;
    }

    logger.debug({ userId }, "⚠️ Orders list cache MISS");
    const result = await fetchFromDB();

    if (result) {
      await redis.setex(key, 120, result); // 2 minutes
    }

    return result;
  } catch (error) {
    logger.error({ err: error, userId }, 'Redis getUserOrders error, falling back to DB');
    return await fetchFromDB();
  }
}

export async function getOrderDetail(
  orderId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchFromDB: () => Promise<any>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
): Promise<any> {
  if (!REDIS_CONFIG.FEATURES.PRODUCT_CACHING) {
    return await fetchFromDB();
  }

  try {
    const key = RedisKeys.orderDetail(orderId);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cached = await redis.get<any>(key);

    if (cached) {
      logger.debug({ orderId }, "✅ Order detail cache HIT");
      return cached;
    }

    logger.debug({ orderId }, "⚠️ Order detail cache MISS");
    const result = await fetchFromDB();

    if (result) {
      await redis.setex(key, 300, result); // 5 minutes
    }

    return result;
  } catch (error) {
    logger.error({ err: error, orderId }, 'Redis getOrderDetail error, falling back to DB');
    return await fetchFromDB();
  }
}

export async function invalidateUserOrders(userId: string): Promise<void> {
  const operation = async () => {
    const key = RedisKeys.userOrders(userId);
    await redis.del(key);
    logger.info({ userId }, "✅ User orders cache invalidated");
  };
  await safeRedisOperation(operation);
}

export async function invalidateOrderDetail(orderId: string): Promise<void> {
  const operation = async () => {
    const key = RedisKeys.orderDetail(orderId);
    await redis.del(key);
    logger.info({ orderId }, "✅ Order detail cache invalidated");
  };
  await safeRedisOperation(operation);
}
