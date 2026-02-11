/**
 * Redis Module Index
 * 
 * Centralized exports for all Redis utilities.
 * Import from this file for convenience.
 */

// Core
export { default as redis, getRedisClient, testRedisConnection, safeRedisOperation } from './client';
export { RedisKeys } from './keys';
export { REDIS_CONFIG } from './config';

// Cart
export {
  getCart,
  setCart,
  addToCart,
  removeFromCart,
  updateCartItemQuantity,
  clearCart,
  mergeGuestCart,
  syncCartToDB,
} from './cart';

// Product
export {
  getProduct,
  setProduct,
  getProductList,
  setProductList,
  invalidateProduct,
  invalidateCategory,
  invalidateAllProducts,
  prefetchProduct,
} from './product';

// Shipping
export {
  getShippingCost,
  cacheShippingCost,
  invalidateShippingCache,
} from './shipping';

// Rate Limiting
export {
  checkRateLimit,
  resetRateLimit,
  getRateLimitInfo,
  rateLimitMiddleware,
} from './ratelimit';

// Monitoring
export {
  recordCacheHit,
  recordCacheMiss,
  getMetrics,
  resetMetrics,
  checkConnectionHealth,
  getMemoryUsage,
  getCacheStats,
  logMetrics,
  periodicHealthCheck,
} from './monitor';

// Types
export type {
  RedisCartItem,
  RedisCart,
  RedisProduct,
  RedisProductList,
  RedisShipping,
  RedisSession,
  RedisRateLimit,
  RedisSearch,
  RedisAnalyticsEvent,
  RedisCacheMetadata,
  RedisMetrics,
} from './types';
