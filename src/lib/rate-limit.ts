/**
 * Simple in-memory Rate Limiter for Next.js App Router (optimized for Vercel/Serverless)
 * Note: Since serverless functions are ephemeral, this won't be as strict as Redis
 * but provides a good first layer of protection against rapid repeated calls.
 */

interface RateLimitStore {
  count: number;
  resetTime: number;
}

const stores = new Map<string, RateLimitStore>();

// Clean up memory every 10 minutes
setInterval(() => {
  const now = Date.now();
  for (const [key, store] of stores.entries()) {
    if (now > store.resetTime) {
      stores.delete(key);
    }
  }
}, 10 * 60 * 1000);

export function rateLimit(identifier: string, limit: number = 5, windowMs: number = 60000) {
  const now = Date.now();
  const key = `${identifier}`;
  
  let store = stores.get(key);
  
  if (!store || now > store.resetTime) {
    store = {
      count: 0,
      resetTime: now + windowMs,
    };
    stores.set(key, store);
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
