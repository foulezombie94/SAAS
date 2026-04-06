import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Distributed Rate Limiter using Upstash Redis for Next.js App Router (optimized for Vercel/Serverless)
 */

// Local fallback store for development or if Redis is unavailable
interface RateLimitStore {
  count: number;
  resetTime: number;
}
const localStores = new Map<string, RateLimitStore>();

// Clean up local memory every 10 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, store] of localStores.entries()) {
      if (now > store.resetTime) {
        localStores.delete(key);
      }
    }
  }, 10 * 60 * 1000);
}

// Initialize Redis only if environment variables are available
const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    })
  : null;

// Cache of Ratelimit instances for different configurations (limit, window)
const ratelimitCache = new Map<string, Ratelimit>();

/**
 * Returns a Ratelimit instance for the specific configuration, creating it if necessary.
 */
function getRatelimit(limit: number, windowMs: number): Ratelimit | null {
  if (!redis) return null;
  
  const key = `${limit}-${windowMs}`;
  if (!ratelimitCache.has(key)) {
    ratelimitCache.set(key, new Ratelimit({
      redis,
      limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
      analytics: true,
      prefix: 'artisan-flow:ratelimit',
    }));
  }
  return ratelimitCache.get(key)!;
}

export async function rateLimit(identifier: string, limit: number = 5, windowMs: number = 60000) {
  const now = Date.now();

  // If Redis is configured, use it for distributed rate limiting
  const ratelimit = getRatelimit(limit, windowMs);
  if (ratelimit) {

    try {
      // Ratelimit.slidingWindow expects tokens per duration. 
      // Note: Upstash Ratelimit has its own window calculation.
      const { success, limit: totalLimit, remaining, reset } = await ratelimit.limit(identifier);
      
      if (!success) {
        const waitSeconds = Math.ceil((reset - now) / 1000);
        return {
          success: false,
          limit: totalLimit,
          remaining: 0,
          reset,
          message: `Trop de requêtes. Veuillez réessayer dans ${waitSeconds} secondes.`
        };
      }

      return {
        success: true,
        limit: totalLimit,
        remaining,
        reset,
      };
    } catch (error) {
      console.error('Redis Rate Limit Error, falling back to in-memory:', error);
      // Fallback to in-memory if Redis fails
    }
  }

  // Local In-Memory Fallback
  const key = `${identifier}`;
  let store = localStores.get(key);
  
  if (!store || now > store.resetTime) {
    store = {
      count: 0,
      resetTime: now + windowMs,
    };
    localStores.set(key, store);
  }
  
  store.count++;
  
  if (store.count > limit) {
    const waitSeconds = Math.ceil((store.resetTime - now) / 1000);
    return {
      success: false,
      limit,
      remaining: 0,
      reset: store.resetTime,
      message: `Trop de requêtes. Veuillez réessayer dans ${waitSeconds} secondes.`
    };
  }
  
  return {
    success: true,
    limit,
    remaining: limit - store.count,
    reset: store.resetTime,
  };
}

