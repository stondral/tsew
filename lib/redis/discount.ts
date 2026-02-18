import redis, { safeRedisOperation } from './client';
import { RedisKeys } from './keys';
import { REDIS_CONFIG } from './config';
import { logger } from '../logger';

/**
 * Discount Code Caching Layer
 * 
 * Caches discount code validation for faster checkout.
 * Critical path optimization for conversion.
 * 
 * Strategy:
 * - Cache valid codes: 1-hour TTL
 * - Invalidate on code update or usage count change
 * - Atomic usage tracking with Redis INCR
 */

interface DiscountCode {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  minOrderValue?: number;
  maxDiscount?: number;
  usageLimit?: number;
  usedCount: number;
  expiresAt?: string;
  isActive: boolean;
  discountSource: 'store' | 'seller';
  seller?: string;
}

/**
 * Check if discount code is still valid
 */
function isDiscountValid(discount: DiscountCode): boolean {
  // Check if active
  if (!discount.isActive) return false;

  // Check expiration
  if (discount.expiresAt) {
    const expiryDate = new Date(discount.expiresAt);
    if (expiryDate < new Date()) return false;
  }

  // Check usage limit
  if (discount.usageLimit && discount.usedCount >= discount.usageLimit) {
    return false;
  }

  return true;
}

/**
 * Get discount code from cache or DB
 */
export async function getDiscountCode(
  code: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  fetchFromDB: () => Promise<any>
): Promise<DiscountCode | null> {
  const upperCode = code.toUpperCase().trim();

  try {
    const key = RedisKeys.discountCode(upperCode);
    const cached = await redis.get<DiscountCode>(key);

    if (cached) {
      // Verify it's still valid
      if (isDiscountValid(cached)) {
        logger.debug({ upperCode }, "✅ Discount code cache HIT");
        return cached;
      } else {
        // Invalidate if no longer valid
        await redis.del(key);
        logger.info({ upperCode }, "⚠️ Discount code expired/invalid, removed from cache");
        return null;
      }
    }

    logger.debug({ upperCode }, "⚠️ Discount code cache MISS");

    // Fetch from DB
    const discount = await fetchFromDB();

    if (discount && isDiscountValid(discount)) {
      // Cache for 1 hour
      await redis.setex(key, REDIS_CONFIG.TTL.DISCOUNT_CODE, discount);
      logger.debug({ upperCode }, "✅ Discount code cached");
      return discount;
    }

    return null;
  } catch (error) {
    logger.error({ err: error, upperCode }, 'Redis getDiscountCode error, falling back to DB');
    const discount = await fetchFromDB();
    return discount && isDiscountValid(discount) ? discount : null;
  }
}

/**
 * Increment discount code usage count atomically
 * Returns true if increment was successful, false if limit exceeded
 */
export async function incrementDiscountUsage(
  code: string,
  usageLimit?: number
): Promise<boolean> {
  const upperCode = code.toUpperCase().trim();

  try {
    const key = `${RedisKeys.discountCode(upperCode)}:usage`;

    // Atomic increment
    const newCount = await redis.incr(key);

    // Set TTL on first use
    if (newCount === 1) {
      await redis.expire(key, REDIS_CONFIG.TTL.DISCOUNT_CODE);
    }

    // Check if limit exceeded
    if (usageLimit && newCount > usageLimit) {
      logger.warn({ upperCode, newCount, usageLimit }, "⚠️ Discount code usage limit exceeded");
      return false;
    }

    logger.info({ upperCode, newCount }, "✅ Discount code usage incremented");
    return true;
  } catch (error) {
    logger.error({ err: error, upperCode }, 'Failed to increment discount usage');
    // Fail open - allow the discount
    return true;
  }
}

/**
 * Get current usage count for a discount code
 */
export async function getDiscountUsageCount(code: string): Promise<number> {
  const upperCode = code.toUpperCase().trim();

  try {
    const key = `${RedisKeys.discountCode(upperCode)}:usage`;
    const count = await redis.get<number>(key);
    return count || 0;
  } catch (error) {
    logger.error({ err: error, upperCode }, 'Failed to get discount usage count');
    return 0;
  }
}

/**
 * Invalidate discount code cache
 * Called when code is updated or deleted
 */
export async function invalidateDiscountCode(code: string): Promise<void> {
  const upperCode = code.toUpperCase().trim();

  const operation = async () => {
    const key = RedisKeys.discountCode(upperCode);
    const usageKey = `${key}:usage`;

    await redis.del(key);
    await redis.del(usageKey);

    logger.info({ upperCode }, "✅ Discount code cache invalidated");
  };

  await safeRedisOperation(operation);
}

/**
 * Reset discount code usage count
 * Useful for admin overrides or testing
 */
export async function resetDiscountUsage(code: string): Promise<void> {
  const upperCode = code.toUpperCase().trim();

  const operation = async () => {
    const usageKey = `${RedisKeys.discountCode(upperCode)}:usage`;
    await redis.del(usageKey);
    logger.info({ upperCode }, "✅ Discount code usage reset");
  };

  await safeRedisOperation(operation);
}
