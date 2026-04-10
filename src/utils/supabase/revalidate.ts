import { revalidateTag } from 'next/cache'

/**
 * 🔄 GLOBAL CACHE REVALIDATION (Production Standard)
 * 
 * CORE RULES:
 * 1. Tags are global per namespace (e.g., 'all-invoices').
 * 2. Invalidation is simple and scalable: one tag per functional group.
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
     * 🚀 ENVIRONMENT SPECIFIC REVALUATION:
     * In this project's dependency tree, revalidateTag is typed to REQUIRE 
     * a second 'profile' argument. While this is non-standard in vanilla Next.js 
     * documentation, it is a hard requirement for the current build worker.
     */
    revalidateTag(tag, 'default')
  })
}

/** 🚀 REVALIDATION HELPERS */

export async function revalidateDashboardCache() {
  revalidate('dashboard')
}

export async function revalidateProfileCache() {
  revalidate('profile')
}

export async function revalidateDocumentCache() {
  revalidate('documents')
}
