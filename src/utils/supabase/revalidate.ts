import { revalidateTag } from 'next/cache'

/**
 * 🔄 USER-SCOPED CACHE REVALIDATION (Ultimate SaaS Model)
 * 
 * Our seniorCache wrapper automatically scopes tags as `${tag}:${userId}`.
 * This function targets those specific scoped tags to ensure that purges
 * are strictly limited to the relevant user (Stripe-Level Scaling).
 */
const TAGS = {
  dashboard: ['dashboard-stats', 'recent-activity'],
  profile: ['user-profile'],
  documents: ['all-invoices', 'all-quotes', 'all-clients'],
} as const

/**
 * REVALIDATE CACHE GROUP (User Scoped)
 * 
 * @param group The tag group to invalidate
 * @param userId The unique ID of the user whose cache should be purged
 */
export function revalidate(group: keyof typeof TAGS, userId: string) {
  if (!userId) {
    console.error(`[REVALIDATE FATAL] Missing userId for group '${group}'. Invalidation aborted to prevent global inconsistency.`)
    return
  }

  TAGS[group].forEach(tag => {
    // Target the automated scoped tags created by seniorCache
    const scopedTag = `${tag}:${userId}`
    
    // Note: Project-specific signature requires 2 arguments ('tag', 'profile')
    revalidateTag(scopedTag, 'default')
  })
}

/** 🚀 SCOPED HELPERS */

export async function revalidateDashboardCache(userId: string) {
  revalidate('dashboard', userId)
}

export async function revalidateProfileCache(userId: string) {
  revalidate('profile', userId)
}

export async function revalidateDocumentCache(userId: string) {
  revalidate('documents', userId)
}
