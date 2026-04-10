import { revalidateTag as nextRevalidateTag } from 'next/cache'

/**
 * 🔄 SURGICAL CACHE REVALIDATION (Senior++ SaaS)
 * 
 * CORE ARCHITECTURE:
 * 1. HYBRID INVALIDATION: Supports both global purges and user-specific purges.
 * 2. STANDARD CONFORMANCE: Uses the standard revalidateTag(tag) signature.
 * 3. PORTABILITY: Avoids custom runtime dependencies while satisfying local types.
 */

// Bypass local type definition if it strictly requires 2 arguments, 
// ensuring the produced code remains standard Next.js compliant.
const revalidateTag = nextRevalidateTag as unknown as (tag: string) => void;

const TAGS = {
  dashboard: ['dashboard-stats', 'recent-activity'],
  profile: ['user-profile'],
  documents: ['all-invoices', 'all-quotes', 'all-clients'],
} as const

/**
 * REVALIDATE CACHE GROUP
 * 
 * Purges cached entries.
 * @param group The functional group to invalidate.
 * @param userId Optional. If provided, only this user's cache is purged (Surgical).
 *                If omitted, the entire group is purged globally (Emergency/Mass Update).
 */
export function revalidate(group: keyof typeof TAGS, userId?: string) {
  TAGS[group].forEach(baseTag => {
    // 🏷️ Determine the target: Global Tag or Scoped Tag (Senior++ Model)
    const targetTag = userId ? `${baseTag}:${userId}` : baseTag
    
    // 🚀 Purge!
    revalidateTag(targetTag)
  })
}

/** 🚀 PRECISION REVALIDATION HELPERS */

export async function revalidateDashboardCache(userId?: string) {
  revalidate('dashboard', userId)
}

export async function revalidateProfileCache(userId?: string) {
  revalidate('profile', userId)
}

export async function revalidateDocumentCache(userId?: string) {
  revalidate('documents', userId)
}
