/**
 * Redis Key Naming Conventions
 * 
 * Centralized key generation for Redis to ensure consistency and avoid collisions.
 * Pattern: {namespace}:{identifier}:{subkey}
 * 
 * Examples:
 * - cart:user123
 * - product:prod456
 * - shipping:hash789
 * - ratelimit:login:user123
 */

export const RedisKeys = {
  /**
   * Cart Keys
   * Pattern: cart:{userId}
   */
  cart: (userId: string) => `cart:${userId}`,
  
  /**
   * Product Keys
   * Pattern: product:{productId}
   */
  product: (productId: string) => `product:${productId}`,
  
  /**
   * Product List Keys
   * Pattern: products:{category}:{page}:{filters}
   */
  productList: (category?: string, page = 1, filters?: Record<string, string>) => {
    const filterStr = filters ? `:${JSON.stringify(filters)}` : '';
    return `products:${category || 'all'}:${page}${filterStr}`;
  },
  
  /**
   * Shipping Keys
   * Pattern: shipping:{hash}
   * Hash is MD5 of origin-dest-weight-dimensions
   */
  shipping: (hash: string) => `shipping:${hash}`,
  
  /**
   * Rate Limit Keys
   * Pattern: ratelimit:{endpoint}:{identifier}
   */
  rateLimit: (endpoint: string, identifier: string) => `ratelimit:${endpoint}:${identifier}`,
  
  /**
   * Session Keys
   * Pattern: session:{userId}
   */
  session: (userId: string) => `session:${userId}`,
  
  /**
   * Search Keys
   * Pattern: search:{query}
   */
  search: (query: string) => `search:${query.toLowerCase().trim()}`,
  
  /**
   * Popular Searches
   * Pattern: search:popular
   * Stored as sorted set with scores
   */
  popularSearches: () => 'search:popular',
  
  /**
   * Analytics Buffer Keys
   * Pattern: analytics:buffer:{type}
   * Stored as list
   */
  analyticsBuffer: (type: string) => `analytics:buffer:${type}`,
  
  // New caching opportunities
  categoryTree: () => 'categories:tree',
  category: (categoryId: string) => `category:${categoryId}`,
  discountCode: (code: string) => `discount:${code.toUpperCase()}`,
  wishlist: (userId: string) => `wishlist:${userId}`,
  seller: (sellerId: string) => `seller:${sellerId}`,
  userOrders: (userId: string, page = 1) => `orders:${userId}:${page}`,
  productReviews: (productId: string, page = 1) => `reviews:${productId}:${page}`,
  
  // Pattern matchers for bulk operations
  patterns: {
    allCarts: 'cart:*',
    allProducts: 'product:*',
    allShipping: 'shipping:*',
    allSessions: 'session:*',
  },
} as const;

export type RedisKeyType = typeof RedisKeys;
