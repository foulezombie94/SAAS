import { Redis } from '@upstash/redis';
import { Ratelimit } from '@upstash/ratelimit';

/**
 * Distributed Rate Limiter using Upstash Redis for Next.js App Router (Level 10 Polish)
 */

export interface RateLimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  reset: number;
  retryAfter: number; // Delta in seconds
  message?: string;
  headers: {
    // Legacy/Common
    'X-RateLimit-Limit': string;
    'X-RateLimit-Remaining': string;
    'X-RateLimit-Reset': string;
    // Modern Standards (IETF-like)
    'RateLimit-Limit': string;
    'RateLimit-Remaining': string;
    'RateLimit-Reset': string;
    'Retry-After'?: string;
  };
}

// Local fallback store for development or if Redis is unavailable
interface RateLimitStore {
  count: number;
  resetTime: number;
}
const localStores = new Map<string, RateLimitStore>();

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
  
  // Improvement: Scale to seconds for more robust parsing in Upstash
  const windowSeconds = Math.ceil(windowMs / 1000);
  const cfgKey = `cfg:${limit}:${windowSeconds}`;
  
  const existing = ratelimitCache.get(cfgKey);
  if (existing) return existing;

  const instance = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(limit, `${windowSeconds} s`),
    analytics: true,
    prefix: 'artisan-flow:ratelimit',
  });
  
  ratelimitCache.set(cfgKey, instance);
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
  // Validation: Security and DX
  if (!identifier) {
    throw new Error('Rate limit identifier is required');
  }

  const now = Date.now();
  
  // Improvement 1: Granular key generation captures BOTH the resource and the config
  // This prevents config leakage (e.g., 5/min logic sharing a bucket with 100/hr)
  const granularKey = `rl:${identifier}:${limit}:${windowMs}`;

  // If Redis is configured, use it for distributed rate limiting
  const ratelimit = getRatelimit(limit, windowMs);
  if (ratelimit) {
    try {
      // Improvement 2: Use granularKey for Redis as well to maintain consistency with memory fallback
      const { success, limit: totalLimit, remaining, reset } = await ratelimit.limit(granularKey);
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
          'RateLimit-Limit': totalLimit.toString(),
          'RateLimit-Remaining': remaining.toString(),
          'RateLimit-Reset': reset.toString(),
        },
      };

      if (!success) {
        result.message = `Trop de requêtes. Veuillez réessayer dans ${retryAfter} secondes.`;
        result.headers['Retry-After'] = retryAfter.toString();
      }

      return result;
    } catch (error) {
      console.error('Redis Rate Limit Error, falling back to in-memory:', error);
      // Fallback logic continues below...
    }
  }

  // Local In-Memory Fallback
  let store = localStores.get(granularKey);
  
  // Passive cleanup
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
      'RateLimit-Limit': limit.toString(),
      'RateLimit-Remaining': remaining.toString(),
      'RateLimit-Reset': store.resetTime.toString(),
    },
  };

  if (!result.success) {
    result.message = `Trop de requêtes. Veuillez réessayer dans ${retryAfter} secondes.`;
    result.headers['Retry-After'] = retryAfter.toString();
  }
  
  return result;
}
