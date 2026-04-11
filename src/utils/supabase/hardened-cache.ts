import { unstable_cache } from 'next/cache'
import { createAdminClient } from './server'

type CacheOptions = {
  revalidate?: number | false
  tags?: string[]
}

/**
 * 🛡️ SENIOR CACHE WRAPPER (Level 18.5+ Stability Fix)
 * 
 * CORE ARCHITECTURE:
 * 1. STABILITY: No dynamic unstable_cache definitions during render.
 * 2. SEGMENTATION: userId is used in keyParts for isolation.
 * 3. OBSERVABILITY: Logs tracer for cache misses.
 * 4. TAGGING: Standard global tags for reliable revalidation.
 * 5. CONTEXT: Uses createAdminClient to avoid cookies() in background scope.
 */

export function seniorCache<T extends (userId: string, supabase?: any, ...args: any[]) => Promise<any>>(
  namespace: string,
  fetcher: T,
  options: CacheOptions
): T {
  // 🏭 STATIC INSTANTIATION (Defined once per namespace at module load)
  // This ensures Next.js internal registry is stable and optimized.
  // Multi-tenant isolation is guaranteed by argument hashing (uid).
  const cachedFn = unstable_cache(
    async (uid: string, ...flowArgs: any[]) => {
      // 📡 OBSERVABILITY: Cache MISS
      console.log(`\x1b[33m[CACHE-MISS]\x1b[0m ${namespace}:${uid}`);
      
      const adminClient = createAdminClient();
      return fetcher(uid, adminClient, ...flowArgs);
    },
    [namespace], // Static namespace key
    options
  );

  return (async (userId: string, ...args: any[]) => {
    // 🕵️ Structural Guard
    if (typeof userId !== 'string' || !userId) {
      throw new Error(`[SECURITY] SeniorCache: Missing userId context for namespace '${namespace}'.`)
    }

    // 🚀 Execute the stable cached function
    return cachedFn(userId, ...args);
  }) as unknown as T;
}
