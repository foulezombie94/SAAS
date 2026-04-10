import { unstable_cache } from 'next/cache'

type CacheOptions = {
  revalidate?: number | false
  tags?: string[]
}

/**
 * 🛡️ SENIOR++ CACHE WRAPPER (Enterprise SaaS)
 * 
 * CORE ARCHITECTURE:
 * 1. STRUCTURAL TYPING: Enforces (userId: string) as the first argument at the type level.
 * 2. EXPLICIT SEGMENTATION: userId is injected manually into keyParts for deterministic isolation.
 * 3. HYBRID TAGGING: Generates both Global AND User-Scoped tags for surgical invalidation.
 * 4. FACTORY PATTERN: Memoizes unstable_cache instances to prevent cache-definition bloat.
 */

// Internal registry to persist cache definitions per user/namespace
const cacheRegistry = new Map<string, any>();

export function seniorCache<T extends (userId: string, ...args: any[]) => Promise<any>>(
  namespace: string,
  fetcher: T,
  options: CacheOptions
): T {
  return (async (userId: string, ...args: any[]) => {
    // 🕵️ Structural Guard: Strictly enforced in high-scale SaaS
    if (typeof userId !== 'string' || !userId) {
      throw new Error(`[SECURITY] SeniorCache: Missing valid userId context for namespace '${namespace}'.`)
    }

    // 🏷️ HYBRID TAGS: [global, global:userId]
    const baseTags = options.tags || [];
    const hybridTags = [
      ...baseTags,
      ...baseTags.map(tag => `${tag}:${userId}`)
    ];

    // 🔑 UNIQUE CACHE IDENTIFIER (Definition Key)
    const registryKey = `${namespace}:${userId}`;

    // 🏭 FACTORY: Get or Create the unstable_cache definition for this user
    if (!cacheRegistry.has(registryKey)) {
      const cachedFn = unstable_cache(
        async (...innerArgs: any[]) => fetcher(innerArgs[0], ...innerArgs.slice(1)),
        [namespace, userId], // Explicit segmentation
        { ...options, tags: hybridTags }
      );
      cacheRegistry.set(registryKey, cachedFn);
    }

    const cachedCall = cacheRegistry.get(registryKey);
    return cachedCall(userId, ...args);
  }) as unknown as T;
}
