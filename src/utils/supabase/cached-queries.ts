import { unstable_cache } from 'next/cache'
import { createClient } from './server'
import { DashboardStats } from '@/types/dashboard'

/**
 * 🛡️ CACHE LAYER - Dashboard Stats
 * Pattern: Dynamic Key + Explicit User Isolation
 */
export async function getCachedDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized access")

  return unstable_cache(
    async (userId: string) => {
      const supabase = await createClient()
      const { data: stats, error } = await (supabase as any).rpc('get_dashboard_analytics', { 
        p_user_id: userId 
      })

      if (error || !stats) {
        if (process.env.NODE_ENV === 'development' && error) throw error
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
    ['dashboard-stats', user.id], // ✅ DYNAMIC KEY
    {
      revalidate: 3600,
      tags: [`dashboard-stats-${user.id}`] // ✅ USER SPECIFIC TAG
    }
  )(user.id)
  .then(stats => stats || {
    revenue: 0,
    revenue_change: 0,
    unpaid: 0,
    unpaid_count: 0,
    acceptedCount: 0,
    quotes_change: 0,
    history: []
  })
}

/**
 * 🛡️ CACHE LAYER - User Profile
 */
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return unstable_cache(
    async (userId: string) => {
      const supabase = await createClient()
      const { data, error } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, email, is_pro, preferred_language')
        .eq('id', userId)
        .single()
      
      if (error && process.env.NODE_ENV === 'development') throw error
      return data
    },
    ['user-profile', user.id], // ✅ DYNAMIC KEY
    {
      revalidate: 60,
      tags: [`profile-${user.id}`] // ✅ USER SPECIFIC TAG
    }
  )(user.id)
}

/**
 * 🛡️ CACHE LAYER - Recent Activity
 */
export async function getCachedRecentQuotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  return unstable_cache(
    async (userId: string) => {
      const supabase = await createClient()
      const { data, error } = await supabase
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
      
      if (error && process.env.NODE_ENV === 'development') throw error
      return data || []
    },
    ['recent-activity', user.id], // ✅ DYNAMIC KEY
    {
      revalidate: 3600,
      tags: [`recent-quotes-${user.id}`] // ✅ USER SPECIFIC TAG
    }
  )(user.id)
}
