import redis, { safeRedisOperation } from './client';
import { RedisKeys } from './keys';
import { REDIS_CONFIG } from './config';

/**
 * Rate Limiting Layer
 * 
 * Redis-based rate limiting using atomic INCR operations.
 * Prevents abuse and protects API endpoints.
 * 
 * Strategy:
 * - Atomic INCR for thread-safe counting
 * - Automatic TTL on first request
 * - Configurable limits per endpoint
 * - Returns 429 with Retry-After header
 */

interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: number; // Unix timestamp
  retryAfter?: number; // Seconds until reset
}

/**
 * Check rate limit for a given key
 * Returns whether the request is allowed and remaining count
 */
export async function checkRateLimit(
  endpoint: string,
  identifier: string,
  limit?: number,
  windowSeconds?: number
): Promise<RateLimitResult> {
  if (!REDIS_CONFIG.FEATURES.RATE_LIMITING) {
    // Rate limiting disabled, allow all requests
    return {
      allowed: true,
      remaining: limit || 100,
      resetAt: Date.now() + (windowSeconds || 60) * 1000,
    };
  }

  // Get limit and window from config if not provided
  const rateLimitConfig = getRateLimitConfig(endpoint);
  const finalLimit = limit || rateLimitConfig.limit;
  const finalWindow = windowSeconds || rateLimitConfig.window;

  try {
    const key = RedisKeys.rateLimit(endpoint, identifier);
    
    // Atomic increment
    const count = await redis.incr(key);

    // Set TTL on first request
    if (count === 1) {
      await redis.expire(key, finalWindow);
    }

    // Get TTL for resetAt calculation
    const ttl = await redis.ttl(key);
    const resetAt = Date.now() + (ttl > 0 ? ttl * 1000 : finalWindow * 1000);

    const allowed = count <= finalLimit;
    const remaining = Math.max(0, finalLimit - count);

    if (!allowed) {
      console.warn(`⚠️ Rate limit exceeded for ${endpoint}:${identifier} (${count}/${finalLimit})`);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: ttl > 0 ? ttl : finalWindow,
      };
    }

    return {
      allowed: true,
      remaining,
      resetAt,
    };
  } catch (error) {
    console.error('Rate limit check failed, allowing request:', error);
    // Fail open - allow request if Redis is down
    return {
      allowed: true,
      remaining: finalLimit,
      resetAt: Date.now() + finalWindow * 1000,
    };
  }
}

/**
 * Reset rate limit for a specific key
 * Useful for admin overrides or testing
 */
export async function resetRateLimit(
  endpoint: string,
  identifier: string
): Promise<void> {
  if (!REDIS_CONFIG.FEATURES.RATE_LIMITING) {
    return;
  }

  const operation = async () => {
    const key = RedisKeys.rateLimit(endpoint, identifier);
    await redis.del(key);
    console.log(`✅ Rate limit reset for ${endpoint}:${identifier}`);
  };

  await safeRedisOperation(operation);
}

/**
 * Get current rate limit info without incrementing
 */
export async function getRateLimitInfo(
  endpoint: string,
  identifier: string
): Promise<{ count: number; ttl: number } | null> {
  if (!REDIS_CONFIG.FEATURES.RATE_LIMITING) {
    return null;
  }

  try {
    const key = RedisKeys.rateLimit(endpoint, identifier);
    const count = await redis.get<number>(key);
    const ttl = await redis.ttl(key);

    if (count === null) {
      return { count: 0, ttl: 0 };
    }

    return {
      count: count || 0,
      ttl: ttl > 0 ? ttl : 0,
    };
  } catch (error) {
    console.error('Failed to get rate limit info:', error);
    return null;
  }
}

/**
 * Get rate limit configuration for endpoint
 */
function getRateLimitConfig(endpoint: string): { limit: number; window: number } {
  switch (endpoint) {
    case 'login':
      return REDIS_CONFIG.RATE_LIMITS.LOGIN;
    case 'checkout':
      return REDIS_CONFIG.RATE_LIMITS.CHECKOUT;
    case 'otp':
      return REDIS_CONFIG.RATE_LIMITS.OTP;
    default:
      return REDIS_CONFIG.RATE_LIMITS.API_GENERAL;
  }
}

/**
 * Middleware helper to check rate limit and return appropriate response
 */
export async function rateLimitMiddleware(
  endpoint: string,
  identifier: string,
  limit?: number,
  windowSeconds?: number
): Promise<{ allowed: boolean; headers: Record<string, string> }> {
  const result = await checkRateLimit(endpoint, identifier, limit, windowSeconds);

  const headers: Record<string, string> = {
    'X-RateLimit-Limit': String(limit || getRateLimitConfig(endpoint).limit),
    'X-RateLimit-Remaining': String(result.remaining),
    'X-RateLimit-Reset': String(result.resetAt),
  };

  if (!result.allowed && result.retryAfter) {
    headers['Retry-After'] = String(result.retryAfter);
  }

  return {
    allowed: result.allowed,
    headers,
  };
}
