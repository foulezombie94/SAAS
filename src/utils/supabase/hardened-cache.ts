import { unstable_cache } from 'next/cache'

type CacheOptions = {
  revalidate?: number | false
  tags?: string[]
}

type Callback = (...args: any[]) => Promise<any>;

/**
 * 🛡️ SENIOR CACHE WRAPPER (Production Standard)
 * 
 * CORE RULES:
 * 1. API: Uses Next.js unstable_cache standard signature.
 * 2. Keying: Positional arguments (like userId) are automatically serialized into the key.
 * 3. Scope: Static 'namespace' prefix provided as keyParts.
 * 4. Security: Minimal runtime check for userId to prevent global leaks.
 */
export function seniorCache<T extends Callback>(
  namespace: string,
  fetcher: T,
  options: CacheOptions
): T {
  // 🚀 Standard Next.js caching logic. 
  // keyParts ['namespace'] will be combined with positional arguments [...args].
  const cachedFn = unstable_cache(
    async (...args: Parameters<T>) => {
      // 🕵️ Optional Security Guard: Ensure we have a context at call-time
      const userId = args[0];
      if (!userId || typeof userId !== 'string') {
        throw new Error(`[SECURITY] SeniorCache: Missing userId in arguments for namespace '${namespace}'.`)
      }
      return fetcher(...args)
    },
    [namespace], // Static base keyParts
    options
  );

  return cachedFn as unknown as T;
}
