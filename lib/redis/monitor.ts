import redis from './client';
import type { RedisMetrics } from './types';
import { logger } from '../logger';

/**
 * Redis Monitoring Utilities
 * 
 * Track cache performance, connection health, and memory usage.
 * Provides insights for optimization and troubleshooting.
 */

// In-memory metrics tracking
let metrics: RedisMetrics = {
  cacheHitRate: 0,
  totalRequests: 0,
  cacheHits: 0,
  cacheMisses: 0,
  memoryUsage: 0,
  connectionStatus: 'connected',
  lastChecked: new Date().toISOString(),
};

/**
 * Record a cache hit
 */
export function recordCacheHit(): void {
  metrics.totalRequests++;
  metrics.cacheHits++;
  updateCacheHitRate();
}

/**
 * Record a cache miss
 */
export function recordCacheMiss(): void {
  metrics.totalRequests++;
  metrics.cacheMisses++;
  updateCacheHitRate();
}

/**
 * Update cache hit rate calculation
 */
function updateCacheHitRate(): void {
  if (metrics.totalRequests > 0) {
    metrics.cacheHitRate = (metrics.cacheHits / metrics.totalRequests) * 100;
  }
}

/**
 * Get current metrics
 */
export function getMetrics(): RedisMetrics {
  return { ...metrics };
}

/**
 * Reset metrics
 */
export function resetMetrics(): void {
  metrics = {
    cacheHitRate: 0,
    totalRequests: 0,
    cacheHits: 0,
    cacheMisses: 0,
    memoryUsage: 0,
    connectionStatus: 'connected',
    lastChecked: new Date().toISOString(),
  };
}

/**
 * Check Redis connection health
 */
export async function checkConnectionHealth(): Promise<boolean> {
  try {
    const result = await redis.ping();
    metrics.connectionStatus = result === 'PONG' ? 'connected' : 'error';
    metrics.lastChecked = new Date().toISOString();
    return result === 'PONG';
  } catch (error) {
    logger.error({ err: error }, 'Redis health check failed');
    metrics.connectionStatus = 'disconnected';
    metrics.lastChecked = new Date().toISOString();
    return false;
  }
}

/**
 * Get Redis memory usage (if supported by Upstash)
 */
export async function getMemoryUsage(): Promise<number> {
  try {
    // Note: Upstash REST API may not support INFO command
    // This is a placeholder for future implementation
    // In production, use Upstash dashboard for memory monitoring
    return metrics.memoryUsage;
  } catch (error) {
    logger.error({ err: error }, 'Failed to get memory usage');
    return 0;
  }
}

/**
 * Get cache statistics summary
 */
export async function getCacheStats(): Promise<{
  hitRate: number;
  totalRequests: number;
  hits: number;
  misses: number;
  connectionStatus: string;
}> {
  await checkConnectionHealth();

  return {
    hitRate: metrics.cacheHitRate,
    totalRequests: metrics.totalRequests,
    hits: metrics.cacheHits,
    misses: metrics.cacheMisses,
    connectionStatus: metrics.connectionStatus,
  };
}

/**
 * Log performance metrics
 */
export function logMetrics(): void {
  logger.info({
    hitRate: `${metrics.cacheHitRate.toFixed(2)}%`,
    totalRequests: metrics.totalRequests,
    cacheHits: metrics.cacheHits,
    cacheMisses: metrics.cacheMisses,
    connectionStatus: metrics.connectionStatus,
    lastChecked: metrics.lastChecked
  }, '📊 Redis Performance Metrics');
}

/**
 * Periodic health check (call this from a cron job or interval)
 */
export async function periodicHealthCheck(): Promise<void> {
  const isHealthy = await checkConnectionHealth();

  if (!isHealthy) {
    logger.error('⚠️ Redis health check failed!');
    // In production, send alert to monitoring service
  } else {
    logger.debug('✅ Redis health check passed');
  }

  // Log metrics every hour
  if (metrics.totalRequests > 0) {
    logMetrics();
  }
}
