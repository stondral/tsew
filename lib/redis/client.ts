import { Redis } from '@upstash/redis';
import { logger, devLog } from '../logger';

/**
 * Redis Client Singleton
 * 
 * Upstash Redis client configured for serverless environments.
 * Uses REST API for maximum compatibility with edge functions.
 * 
 * Environment Variables Required:
 * - UPSTASH_REDIS_REST_URL
 * - UPSTASH_REDIS_REST_TOKEN
 */

// Validate environment variables
if (!process.env.UPSTASH_REDIS_REST_URL) {
  throw new Error('UPSTASH_REDIS_REST_URL is not defined in environment variables');
}

if (!process.env.UPSTASH_REDIS_REST_TOKEN) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined in environment variables');
}

// Create Redis client singleton
const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL,
  token: process.env.UPSTASH_REDIS_REST_TOKEN,

  // Automatic retry with exponential backoff
  retry: {
    retries: 3,
    backoff: (retryCount) => Math.min(1000 * 2 ** retryCount, 10000),
  },

  // Enable automatic deserialization of JSON
  automaticDeserialization: true,
});

/**
 * Test Redis connection
 * Throws error if connection fails
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const result = await redis.ping();
    if (result === 'PONG') {
      devLog('✅ Redis connection successful');
      return true;
    }
    throw new Error('Redis ping failed');
  } catch (error) {
    logger.error({ err: error }, '❌ Redis connection failed');
    throw error;
  }
}

/**
 * Get Redis client instance
 */
export function getRedisClient(): Redis {
  return redis;
}

/**
 * Graceful fallback wrapper
 * If Redis fails, logs error and returns null instead of throwing
 * Use this for non-critical operations where DB fallback is acceptable
 */
export async function safeRedisOperation<T>(
  operation: () => Promise<T>,
  fallbackValue: T | null = null
): Promise<T | null> {
  try {
    return await operation();
  } catch (error) {
    logger.error({ err: error }, 'Redis operation failed, using fallback');
    return fallbackValue;
  }
}

// Export default client
export default redis;
