import { unstable_cache } from 'next/cache'

type CacheOptions = {
  revalidate?: number | false
  tags?: string[]
}

type Callback = (...args: any[]) => Promise<any>;

/**
 * 🛡️ SENIOR++ CACHE WRAPPER (Level 18.5+ Observability)
 * 
 * CORE ARCHITECTURE:
 * 1. STRUCTURAL TYPING: Enforces (userId: string) prefix.
 * 2. HYBRID TAGGING: Surgical invalidation (Global + Scoped).
 * 3. OBSERVABILITY: Discrete logging for Cache Access and Cache Misses.
 * 4. FACTORY PATTERN: Memoized definitions to prevent memory bloat.
 */

const cacheRegistry = new Map<string, any>();

export function seniorCache<T extends (userId: string, ...args: any[]) => Promise<any>>(
  namespace: string,
  fetcher: T,
  options: CacheOptions
): T {
  return (async (userId: string, ...args: any[]) => {
    // 🕵️ Structural Guard
    if (typeof userId !== 'string' || !userId) {
      throw new Error(`[SECURITY] SeniorCache: Missing userId context for namespace '${namespace}'.`)
    }

    // 🏷️ HYBRID TAGS
    const baseTags = options.tags || [];
    const hybridTags = [
      ...baseTags,
      ...baseTags.map(tag => `${tag}:${userId}`)
    ];

    const registryKey = `${namespace}:${userId}`;

    // 🏭 FACTORY: Get or Create Definition
    if (!cacheRegistry.has(registryKey)) {
      const cachedFn = unstable_cache(
        async (...innerArgs: any[]) => {
          // 📡 OBSERVABILITY: Cache MISS (This only runs if Next.js doesn't have the data)
          console.log(`\x1b[33m[CACHE-MISS]\x1b[0m ${namespace}:${userId}`);
          return fetcher(innerArgs[0], ...innerArgs.slice(1));
        },
        [namespace, userId],
        { ...options, tags: hybridTags }
      );
      cacheRegistry.set(registryKey, cachedFn);
    }

    // 📡 OBSERVABILITY: Cache ACCESS
    // Note: In Next.js, we don't know for sure if it's a HIT until the fetcher skips execution.
    // This trace helps debug the request chain.
    console.log(`\x1b[34m[CACHE-ACCESS]\x1b[0m ${namespace}:${userId}`);

    const cachedCall = cacheRegistry.get(registryKey);
    return cachedCall(userId, ...args);
  }) as unknown as T;
}
