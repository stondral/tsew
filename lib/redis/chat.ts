import redis, { safeRedisOperation } from './client';
import { RedisKeys } from './keys';

const CHAT_TTL_SECONDS = 3 * 24 * 60 * 60; // 3 days

/**
 * Fetch messages for a ticket from Redis cache.
 */
export async function getCachedMessages(ticketId: string) {
    return safeRedisOperation(async () => {
        const key = RedisKeys.supportMessages(ticketId);
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = await redis.get<any[]>(key);
        return data || null;
    });
}

/**
 * Store the full list of messages in Redis.
 * Useful when backfilling from the database.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function cacheMessages(ticketId: string, messages: any[]) {
    return safeRedisOperation(async () => {
        const key = RedisKeys.supportMessages(ticketId);
        await redis.set(key, messages, { ex: CHAT_TTL_SECONDS });
        return true;
    });
}

/**
 * Append a single newly sent message to the existing cache, if the cache exists.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function appendCachedMessage(ticketId: string, message: any) {
    return safeRedisOperation(async () => {
        const key = RedisKeys.supportMessages(ticketId);

        // Fetch current cache
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const existing = await redis.get<any[]>(key);

        if (existing) {
            // If we have cached messages, append the new one and reset the TTL
            existing.push(message);
            await redis.set(key, existing, { ex: CHAT_TTL_SECONDS });
            console.log(`✅ Appended message ${message.id} to Redis cache for ticket ${ticketId}`);
        } else {
            // If the cache expired or isn't populated, we'll let the next GET request backfill it
            console.log(`ℹ️ Cache miss for ticket ${ticketId}, skipping append`);
        }

        return true;
    });
}
