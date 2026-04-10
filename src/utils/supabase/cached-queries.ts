import { unstable_cache } from 'next/cache'
import { createClient } from './server'
import { DashboardStats } from '@/types/dashboard'

/**
 * 🛡️ CACHE REGISTRY
 * We use a Map to store unstable_cache instances per user.
 * This guarantees:
 * 1. Isolation: Explicit dynamic key ['key', userId]
 * 2. Performance: Function is only declared ONCE per user in the server's lifecycle.
 */
const statsCaches = new Map<string, any>()
const profileCaches = new Map<string, any>()
const quotesCaches = new Map<string, any>()

/** 💹 DASHBOARD STATS */
export async function getCachedDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized access")

  if (!statsCaches.has(user.id)) {
    statsCaches.set(user.id, unstable_cache(
      async (userId: string) => {
        const innerSupabase = await createClient()
        const { data: stats, error } = await (innerSupabase as any).rpc('get_dashboard_analytics', { 
          p_user_id: userId 
        })

        if (error || !stats) {
          console.error('[STATS ERROR]', error || 'No data returned')
          return null
        }

        return {
          revenue: Number(stats.revenue ?? 0),
          revenue_change: Number(stats.revenue_change ?? 0),
          unpaid: Number(stats.unpaid ?? 0),
          unpaid_count: Number(stats.unpaid_count ?? 0),
          acceptedCount: Number(stats.acceptedCount ?? 0),
          quotes_change: Number(stats.quotes_change ?? 0),
          history: Array.isArray(stats.history) ? stats.history : []
        }
      },
      ['dashboard-stats', user.id], // ✅ SECURE DYNAMIC KEY
      { revalidate: 3600, tags: ['dashboard-stats'] }
    ))
  }

  const stats = await statsCaches.get(user.id)(user.id)
  return stats || {
    revenue: 0, revenue_change: 0, unpaid: 0, unpaid_count: 0,
    acceptedCount: 0, quotes_change: 0, history: []
  }
}

/** 👤 USER PROFILE */
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  if (!profileCaches.has(user.id)) {
    profileCaches.set(user.id, unstable_cache(
      async (userId: string) => {
        const innerSupabase = await createClient()
        const { data, error } = await innerSupabase
          .from('profiles')
          .select('id, first_name, last_name, company_name, email, is_pro, preferred_language')
          .eq('id', userId)
          .single()
        return error ? null : data
      },
      ['user-profile', user.id],
      { revalidate: 60, tags: ['user-profile'] }
    ))
  }

  return profileCaches.get(user.id)(user.id)
}

/** 📄 RECENT ACTIVITY */
export async function getCachedRecentQuotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  if (!quotesCaches.has(user.id)) {
    quotesCaches.set(user.id, unstable_cache(
      async (userId: string) => {
        const innerSupabase = await createClient()
        const { data, error } = await innerSupabase
          .from('quotes')
          .select('id, number, status, total_ttc, created_at, clients(name)')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(10)
        return error ? [] : data
      },
      ['recent-activity', user.id],
      { revalidate: 3600, tags: ['recent-activity'] }
    ))
  }

  return quotesCaches.get(user.id)(user.id)
}
