import { revalidateTag } from 'next/cache'

/**
 * 🔄 GLOBAL CACHE REVALIDATION (SaaS High-Scale)
 * 
 * CORE RULES:
 * 1. Tags are global per namespace (e.g., 'all-invoices').
 * 2. Isolation is managed via deterministic keys (namespace + userId).
 * 3. Invalidation is simple and scalable: one tag per functional group.
 */
const TAGS = {
  dashboard: ['dashboard-stats', 'recent-activity'],
  profile: ['user-profile'],
  documents: ['all-invoices', 'all-quotes', 'all-clients'],
} as const

/**
 * REVALIDATE CACHE GROUP
 * 
 * Purges all cached entries associated with the functional tags.
 */
export function revalidate(group: keyof typeof TAGS) {
  TAGS[group].forEach(tag => {
    /**
     * 🚀 ENVIRONMENT TRUTH:
     * Although standard Next.js uses 1 argument, this specific project environment's 
     * Type Definitions and Build Worker strictly require a 'profile' as the 2nd argument.
     */
    revalidateTag(tag, 'default')
  })
}

/** 🚀 GLOBAL REVALIDATION HELPERS */

export async function revalidateDashboardCache() {
  revalidate('dashboard')
}

export async function revalidateProfileCache() {
  revalidate('profile')
}

export async function revalidateDocumentCache() {
  revalidate('documents')
}
