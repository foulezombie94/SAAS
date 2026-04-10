import { unstable_cache } from 'next/cache'
import { createClient } from './server'
import { DashboardStats } from '@/types/dashboard'

/**
 * 💹 DASHBOARD STATS
 * Pattern: Factory Call with explicit Dynamic Key Parts
 * SECURITY: Standardizes user-isolation by injecting the ID directly into the key.
 */
export async function getCachedDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized access")

  const stats = await unstable_cache(
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
    ['dashboard-stats', user.id], // ✅ EXPLICIT ISOLATION IN THE KEY
    {
      revalidate: 3600,
      tags: ['dashboard-stats']
    }
  )(user.id)
  
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

  return unstable_cache(
    async (userId: string) => {
      const innerSupabase = await createClient()
      const { data, error } = await innerSupabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, email, is_pro, preferred_language')
        .eq('id', userId)
        .single()
      return error ? null : data
    },
    ['user-profile', user.id], // ✅ EXPLICIT ISOLATION
    {
      revalidate: 60,
      tags: ['user-profile']
    }
  )(user.id)
}

/** 📄 RECENT ACTIVITY */
export async function getCachedRecentQuotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  return unstable_cache(
    async (userId: string) => {
      const innerSupabase = await createClient()
      const { data, error } = await innerSupabase
        .from('quotes')
        .select(`
          id, 
          number, 
          status, 
          total_ttc, 
          created_at, 
          clients (
            name
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10)
      return error ? [] : data
    },
    ['recent-activity', user.id], // ✅ EXPLICIT ISOLATION
    {
      revalidate: 3600,
      tags: ['recent-activity']
    }
  )(user.id)
}
