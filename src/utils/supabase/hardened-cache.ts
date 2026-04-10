import { unstable_cache } from 'next/cache'

/**
 * 🛡️ HARDENED CACHE WRAPPER (SaaS Grade 3)
 * Enforces absolute multi-tenant isolation through type-safety and runtime guards.
 * Uses the Next.js 16 functional key pattern for top-level singleton benefit.
 */

type CacheOptions = {
  revalidate?: number | false;
  tags?: string[];
}

/**
 * Creates a type-safe cached function that MANDATES userId as the first argument.
 * 
 * @param fetcher The data fetching function (first arg must be userId)
 * @param keyPartsFn A function that returns string[] isolation keys
 * @param options Next.js cache options
 */
export function hardenedCache<T extends (userId: string, ...args: any[]) => Promise<any>>(
  fetcher: T,
  keyPartsFn: (userId: string, ...args: any[]) => string[],
  options: CacheOptions
): T {
  // Create the cached instance at the call site (module level)
  return (unstable_cache as any)(
    async (userId: string, ...args: any[]) => {
      // 🕵️ SECURITY CHECK: Ensure userId is valid before fetching
      if (!userId || typeof userId !== 'string') {
        throw new Error(`[SECURITY] Invalid userId for cached query: ${userId}`)
      }
      
      // Perform the fetch
      return fetcher(userId, ...args)
    },
    // We pass the keyParts function directly. In this environment, 
    // unstable_cache uses this to generate the key at runtime per-call.
    (userId: string, ...args: any[]) => {
      const keys = keyPartsFn(userId, ...args)
      
      // 🔍 RUNTIME GUARD: Absolute isolation check
      if (!keys.includes(userId)) {
        throw new Error(`[SECURITY CRITICAL] Multi-tenant isolation breach: userId '${userId}' missing from cache keys.`)
      }
      return keys
    },
    options
  ) as unknown as T
}
