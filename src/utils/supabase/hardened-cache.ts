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

export function seniorCache<T extends (userId: string, supabase?: ReturnType<typeof createAdminClient>, ...args: any[]) => Promise<any>>(
  namespace: string,
  fetcher: T,
  options: CacheOptions
): T {
  // 🛠️ Stable Serialization (Grade 18.5+ Consistency)
  const stableStringify = (obj: any): string => {
    return JSON.stringify(obj, (key, value) =>
      value && !Array.isArray(value) && typeof value === 'object'
        ? Object.keys(value).sort().reduce((sorted: any, k) => {
            sorted[k] = value[k];
            return sorted;
          }, {})
        : value
    );
  };

  // 🏭 STATIC INSTANTIATION (Defined once per namespace at module load)
  const cachedFn = unstable_cache(
    async (uid: string, argsSerialized: string) => {
      console.log(`\x1b[33m[CACHE-MISS]\x1b[0m ${namespace}:${uid}`);
      
      let args: any[] = [];
      try {
        args = JSON.parse(argsSerialized);
      } catch (e) {
        console.error(`[CACHE ERROR] Failed to parse args for ${namespace}:${uid}`, e);
        // Fallback to fetcher with empty/default args if corruption
      }

      const adminClient = createAdminClient();
      return fetcher(uid, adminClient, ...args);
    },
    [namespace], 
    options
  );

  return (async (userId: string, ...args: any[]) => {
    if (typeof userId !== 'string' || !userId) {
      throw new Error(`[SECURITY] SeniorCache: Missing userId context for namespace '${namespace}'.`)
    }

    // 🚀 Execute with Stable Serialized Arguments
    return cachedFn(userId, stableStringify(args));
  }) as unknown as T;
}
