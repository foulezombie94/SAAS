import { unstable_cache } from 'next/cache'

type CacheOptions = {
  revalidate?: number | false
  tags?: string[]
}

/**
 * 🛡️ SENIOR CACHE WRAPPER (SaaS High-Scale)
 * 
 * CORE RULES:
 * 1. Isolation = Enforced at the key level: [namespace, userId, ...args].
 * 2. Invalidation = Managed via global tags for high-scale simplicity.
 * 3. Security = Authenticated context (userId) is mandatory.
 */
export function seniorCache<T extends (userId: string, ...args: any[]) => Promise<any>>(
  namespace: string,
  fetcher: T,
  options: CacheOptions
): T {
  return (unstable_cache as any)(
    async (userId: string, ...args: any[]) => {
      // 🕵️ Logical Guard: Ensure userId is provided for multi-tenant isolation
      if (!userId || typeof userId !== 'string') {
        throw new Error(`[SECURITY] SeniorCache: Missing userId context for namespace '${namespace}'.`)
      }
      return fetcher(userId, ...args)
    },
    // 🔑 Deterministic Key generation: the only real line of defense for data isolation.
    (userId: string, ...args: any[]) => [
      namespace,
      userId,
      ...args.map(String)
    ],
    options
  ) as unknown as T
}
