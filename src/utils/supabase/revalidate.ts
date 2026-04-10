import { revalidateTag } from 'next/cache'

/**
 * 🔄 REVALIDATE CACHE (Clean SaaS Standard)
 * Uses the stable Next.js revalidateTag API.
 */
export async function revalidateDashboardCache() {
  // @ts-expect-error - Next.js 16 specific API signature
  revalidateTag('dashboard-stats')
  // @ts-expect-error
  revalidateTag('recent-activity')
}

export async function revalidateProfileCache() {
  // @ts-expect-error
  revalidateTag('user-profile')
}

export async function revalidateDocumentCache() {
  // @ts-expect-error
  revalidateTag('all-invoices')
  // @ts-expect-error
  revalidateTag('all-quotes')
}
