import { revalidateTag } from 'next/cache'

/**
 * 🔄 REVALIDATE CACHE (Clean SaaS Standard - Grade 3)
 * Signature Fix: In this Next.js 16 version, a 'profile' argument is mandatory.
 * We use the 'default' profile for seamless production invalidation.
 */
export async function revalidateDashboardCache() {
  revalidateTag('dashboard-stats', 'default')
  revalidateTag('recent-activity', 'default')
}

export async function revalidateProfileCache() {
  revalidateTag('user-profile', 'default')
}

export async function revalidateDocumentCache() {
  revalidateTag('all-invoices', 'default')
  revalidateTag('all-quotes', 'default')
  revalidateTag('all-clients', 'default')
}
