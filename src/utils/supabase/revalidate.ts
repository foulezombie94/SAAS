import { revalidateTag } from 'next/cache'

/**
 * 🔄 GLOBAL CACHE REVALIDATION (Clean SaaS Standard)
 * Tags are global invalidation keys. User isolation is handled by 'unstable_cache'.
 */
const TAGS = {
  dashboard: ['dashboard-stats', 'recent-activity'],
  profile: ['user-profile'],
  documents: ['all-invoices', 'all-quotes', 'all-clients'],
} as const

/**
 * REVALIDATE CACHE GROUP
 * Standard Next.js revalidateTag signature (1 argument).
 */
export function revalidate(group: keyof typeof TAGS) {
  TAGS[group].forEach(tag => {
    // @ts-expect-error - Standard signature is 1 argument (tag)
    revalidateTag(tag)
  })
}

// Legacy helpers for specific pages (using the group revalidator)
export async function revalidateDashboardCache() {
  revalidate('dashboard')
}

export async function revalidateProfileCache() {
  revalidate('profile')
}

export async function revalidateDocumentCache() {
  revalidate('documents')
}
