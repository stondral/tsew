/**
 * Redis Type Definitions
 * 
 * TypeScript interfaces for all data structures stored in Redis.
 * Ensures type safety across all Redis operations.
 */

/**
 * Cart Item stored in Redis
 */
export interface RedisCartItem {
  productId: string;
  variantId?: string | null;
  quantity: number;
}

/**
 * Cart structure in Redis
 */
export interface RedisCart {
  userId: string;
  items: RedisCartItem[];
  updatedAt: string; // ISO timestamp
  lastSyncedAt?: string; // ISO timestamp of last DB sync
}

/**
 * Product structure in Redis (cached from DB)
 */
export interface RedisProduct {
  id: string;
  name: string;
  slug: string;
  basePrice: number;
  stock: number;
  status: string;
  isActive: boolean;
  category?: string;
  media?: Array<{
    url: string;
    sizes?: {
      thumbnail?: { url: string };
    };
  }>;
  variants?: Array<{
    id: string;
    name: string;
    price: number;
    stock: number;
    image?: {
      url: string;
      sizes?: {
        thumbnail?: { url: string };
      };
    };
  }>;
  cachedAt: string; // ISO timestamp
}

/**
 * Product List structure in Redis
 */
export interface RedisProductList {
  products: RedisProduct[];
  totalPages: number;
  totalDocs: number;
  page: number;
  cachedAt: string; // ISO timestamp
}

/**
 * Shipping Cost structure in Redis
 */
export interface RedisShipping {
  cost: number;
  estimatedDays: number;
  serviceName: string;
  params: {
    origin: string;
    destination: string;
    weight: number;
    dimensions?: {
      length: number;
      width: number;
      height: number;
    };
  };
  cachedAt: string; // ISO timestamp
}

/**
 * Session structure in Redis
 */
export interface RedisSession {
  userId: string;
  email: string;
  role: string;
  createdAt: string; // ISO timestamp
  lastActivityAt: string; // ISO timestamp
  metadata?: Record<string, unknown>;
}

/**
 * Rate Limit structure in Redis
 */
export interface RedisRateLimit {
  count: number;
  resetAt: number; // Unix timestamp
}

/**
 * Search Query structure in Redis
 */
export interface RedisSearch {
  query: string;
  results: Array<{
    id: string;
    name: string;
    slug: string;
  }>;
  cachedAt: string; // ISO timestamp
}

/**
 * Analytics Event structure in Redis buffer
 */
export interface RedisAnalyticsEvent {
  type: string;
  userId?: string;
  sessionId?: string;
  data: Record<string, unknown>;
  timestamp: string; // ISO timestamp
}

/**
 * Cache Metadata
 */
export interface RedisCacheMetadata {
  key: string;
  ttl: number; // Remaining TTL in seconds
  size: number; // Size in bytes
  type: string; // Redis data type
}

/**
 * Monitor Metrics
 */
export interface RedisMetrics {
  cacheHitRate: number; // Percentage
  totalRequests: number;
  cacheHits: number;
  cacheMisses: number;
  memoryUsage: number; // Bytes
  connectionStatus: 'connected' | 'disconnected' | 'error';
  lastChecked: string; // ISO timestamp
}
