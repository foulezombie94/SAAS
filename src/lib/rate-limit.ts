import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Distributed Rate Limiter using Upstash Redis for Next.js App Router (optimized for Vercel/Serverless)
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number; // Delta in seconds
  message?: string;
  headers?: {
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
    'Retry-After'?: string;
  };
}

// Local fallback store for development or if Redis is unavailable
interface RateLimitStore {
  count: number;
  resetTime: number;
}
const localStores = new Map<string, RateLimitStore>();

// Removed setInterval for serverless compatibility (Vercel)
// Instances are ephemeral; passive cleanup happens on access.

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
  
  const key = `cfg:${limit}:${windowMs}`;
  const existing = ratelimitCache.get(key);
  if (existing) return existing;

  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowMs} ms`),
    analytics: true,
    prefix: 'artisan-flow:ratelimit',
  });
  
  ratelimitCache.set(key, instance);
  return instance;
}

/**
 * Core Rate Limit implementation with distributed Redis + Memory Fallback.
 * @param identifier Unique key (e.g., 'auth:login', IP, or UserId)
 * @param limit Max permitted requests
 * @param windowMs Time window in milliseconds
 */
export async function rateLimit(
  identifier: string, 
  limit: number = 5, 
  windowMs: number = 60000
): Promise<RateLimitResult> {
  const now = Date.now();
  
  // Improvement: Granular key generation to avoid collisions across different configs
  const granularKey = `rl:${identifier}:${limit}:${windowMs}`;

  // If Redis is configured, use it for distributed rate limiting
  const ratelimit = getRatelimit(limit, windowMs);
  if (ratelimit) {
    try {
      const { success, limit: totalLimit, remaining, reset } = await ratelimit.limit(identifier);
      const retryAfter = Math.max(0, Math.ceil((reset - now) / 1000));
      
      const result: RateLimitResult = {
        success,
        limit: totalLimit,
        remaining,
        reset,
        retryAfter,
        headers: {
          'X-RateLimit-Limit': totalLimit.toString(),
          'X-RateLimit-Remaining': remaining.toString(),
          'X-RateLimit-Reset': reset.toString(),
        },
      };

      if (!success) {
        result.message = `Trop de requêtes. Veuillez réessayer dans ${retryAfter} secondes.`;
        result.headers!['Retry-After'] = retryAfter.toString();
      }

      return result;
    } catch (error) {
      console.error('Redis Rate Limit Error, falling back to in-memory:', error);
      // Fallback logic continues below...
    }
  }

  // Local In-Memory Fallback (Active only if Redis fails or is unconfigured)
  let store = localStores.get(granularKey);
  
  // Passive cleanup for serverless safety
  if (!store || now > store.resetTime) {
    store = {
      count: 0,
      resetTime: now + windowMs,
    };
    localStores.set(granularKey, store);
  }
  
  store.count++;
  const retryAfter = Math.max(0, Math.ceil((store.resetTime - now) / 1000));
  const remaining = Math.max(0, limit - store.count);

  const result: RateLimitResult = {
    success: store.count <= limit,
    limit,
    remaining,
    reset: store.resetTime,
    retryAfter,
    headers: {
      'X-RateLimit-Limit': limit.toString(),
      'X-RateLimit-Remaining': remaining.toString(),
      'X-RateLimit-Reset': store.resetTime.toString(),
    },
  };

  if (!result.success) {
    result.message = `Trop de requêtes. Veuillez réessayer dans ${retryAfter} secondes.`;
    result.headers!['Retry-After'] = retryAfter.toString();
  }
  
  return result;
}
