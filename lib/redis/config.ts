/**
 * Redis Configuration
 * 
 * Centralized TTL and cache configuration for all Redis operations.
 * Adjust these values based on your application's needs and usage patterns.
 */

export const REDIS_CONFIG = {
  // TTL (Time To Live) in seconds
  TTL: {
    // Cart & Wishlist
    CART: 7 * 24 * 60 * 60, // 7 days
    WISHLIST: 7 * 24 * 60 * 60, // 7 days
    
    // Products & Categories
    PRODUCT: 60 * 60, // 1 hour
    PRODUCT_LIST: 15 * 60, // 15 minutes
    CATEGORY_TREE: 24 * 60 * 60, // 24 hours
    
    // Shipping & Discount
    SHIPPING: 6 * 60 * 60, // 6 hours
    DISCOUNT_CODE: 60 * 60, // 1 hour
    
    // User & Session
    SESSION: 24 * 60 * 60, // 24 hours
    USER_PROFILE: 6 * 60 * 60, // 6 hours
    
    // Analytics & Search
    SEARCH_RESULTS: 15 * 60, // 15 minutes
    POPULAR_SEARCHES: 24 * 60 * 60, // 24 hours
    ANALYTICS_BUFFER: 5 * 60, // 5 minutes
  },
  
  // Rate Limiting Rules
  RATE_LIMITS: {
    LOGIN: {
      limit: 5,
      window: 15 * 60, // 15 minutes
    },
    CHECKOUT: {
      limit: 10,
      window: 5 * 60, // 5 minutes
    },
    OTP: {
      limit: 3,
      window: 5 * 60, // 5 minutes
    },
    API_GENERAL: {
      limit: 100,
      window: 60, // 1 minute
    },
  },
  
  // Feature Flags for gradual rollout
  FEATURES: {
    CART_CACHING: process.env.REDIS_CART_ENABLED !== 'false', // Default: enabled
    PRODUCT_CACHING: process.env.REDIS_PRODUCT_ENABLED !== 'false', // Default: enabled
    SHIPPING_CACHING: process.env.REDIS_SHIPPING_ENABLED !== 'false', // Default: enabled
    RATE_LIMITING: process.env.REDIS_RATE_LIMIT_ENABLED !== 'false', // Default: enabled
    SESSION_CACHING: process.env.REDIS_SESSION_ENABLED !== 'false', // Default: enabled
  },
  
  // Sync Configuration
  SYNC: {
    // Cart sync to DB interval (in milliseconds)
    CART_SYNC_INTERVAL: 5 * 60 * 1000, // 5 minutes
    
    // Analytics batch write interval (in milliseconds)
    ANALYTICS_BATCH_INTERVAL: 5 * 60 * 1000, // 5 minutes
  },
} as const;

export type RedisConfig = typeof REDIS_CONFIG;
