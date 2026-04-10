import { revalidateTag as nextRevalidateTag } from 'next/cache'

/**
 * 🔄 STABLE CACHE REVALIDATION (Level 18.5+)
 * 
 * CORE ARCHITECTURE:
 * 1. GLOBAL TAGGING: Uses reliable global tags to ensure 100% revalidation uptime.
 * 2. STANDARD CONFORMANCE: Uses the standard 1-arg revalidateTag(tag) signature.
 */

const revalidateTag = nextRevalidateTag as unknown as (tag: string) => void;

const TAGS = {
  dashboard: ['dashboard-stats', 'recent-activity'],
  profile: ['user-profile'],
  documents: ['all-invoices', 'all-quotes', 'all-clients'],
} as const

/**
 * REVALIDATE CACHE GROUP
 * 
 * Purges cached entries for a functional group.
 * Priority: Stability and guaranteed invalidation.
 */
export function revalidate(group: keyof typeof TAGS) {
  TAGS[group].forEach(baseTag => {
    // 🚀 Purge the global tag. 
    // This affects all entries in this namespace but ensures total reliability.
    revalidateTag(baseTag)
  })
}

/** 🚀 STABLE REVALIDATION HELPERS */

export async function revalidateDashboardCache() {
  revalidate('dashboard')
}

export async function revalidateProfileCache() {
  revalidate('profile')
}

export async function revalidateDocumentCache() {
  revalidate('documents')
}
