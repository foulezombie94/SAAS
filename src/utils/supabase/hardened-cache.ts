import { unstable_cache } from 'next/cache'

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
 */

export function seniorCache<T extends (userId: string, ...args: any[]) => Promise<any>>(
  namespace: string,
  fetcher: T,
  options: CacheOptions
): T {
  // 🏭 Define the cache statically (once per module load)
  // This ensures Next.js correctly registers the cache definition.
  const cachedFn = unstable_cache(
    async (userId: string, ...args: any[]) => {
      // 📡 OBSERVABILITY: Cache MISS
      console.log(`\x1b[33m[CACHE-MISS]\x1b[0m ${namespace}:${userId}`);
      return fetcher(userId, ...args);
    },
    [namespace], // Base key parts
    options
  );

  return (async (userId: string, ...args: any[]) => {
    // 🕵️ Structural Guard
    if (typeof userId !== 'string' || !userId) {
      throw new Error(`[SECURITY] SeniorCache: Missing userId context for namespace '${namespace}'.`)
    }

    // 📡 OBSERVABILITY: Cache ACCESS
    console.log(`\x1b[34m[CACHE-ACCESS]\x1b[0m ${namespace}:${userId}`);

    // Call the static cache, passing userId into the arguments to ensure 
    // it's used as part of the total key generation (automatic key serialization).
    return cachedFn(userId, ...args);
  }) as unknown as T;
}
