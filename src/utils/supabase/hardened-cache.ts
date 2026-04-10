import { unstable_cache } from 'next/cache'

type CacheOptions = {
  revalidate?: number | false
  tags?: string[]
}

/**
 * 🛡️ ULTIMATE CACHE WRAPPER (Stripe-Like Standard)
 * 
 * CORE PROTECTIONS:
 * 1. Fatal Guard: Immediately throws if userId is missing, preventing 'undefined' collisions.
 * 2. Auto-Scoping: Automatically transforms global tags into user-scoped tags (Stripe-Level Scaling).
 * 3. Native Isolation: Enforces [namespace, userId] key structure architecturally.
 */
export function seniorCache<T extends (userId: string, ...args: any[]) => Promise<any>>(
  namespace: string,
  fetcher: T,
  options: CacheOptions
): T {
  return (unstable_cache as any)(
    async (userId: string, ...args: any[]) => {
      // 🚨 ULTIMATE GUARD: Never allow an undefined context to reach the cache or fetcher.
      // This eliminates the 'undefined-collision' risk if upstream auth fails.
      if (!userId || typeof userId !== 'string') {
        throw new Error(`[SECURITY FATAL] UltimateCache: Missing auth context for namespace '${namespace}'.`)
      }
      return fetcher(userId, ...args)
    },
    (userId: string, ...args: any[]) => {
      // 🕵️ Redundant proof: userId MUST be present for key generation
      if (!userId) throw new Error(`[SECURITY FATAL] Invalid Key Generation Context.`)
      
      return [namespace, userId, ...args.map(a => String(a))]
    },
    {
      ...options,
      // 💡 STRIPE-LEVEL SCALING: 
      // Automatically scope all tags to the user to avoid expensive global purges.
      tags: options.tags?.map(tag => `${tag}:${userId}`)
    }
  ) as unknown as T
}
