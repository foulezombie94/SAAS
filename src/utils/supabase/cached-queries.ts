import { unstable_cache } from 'next/cache'
import { createClient } from './server'
import { DashboardStats } from '@/types/dashboard'

/**
 * 🛡️ CACHE LAYER - Dashboard Stats (Official Next.js 16 Pattern)
 * 
 * SECURITY NOTE: 
 * In Next.js 15/16, 'unstable_cache' automatically hashes the arguments 
 * to provide unique cache entries. Passing 'userId' as an argument ensures 
 * 100% data isolation between artisans without manual Map management.
 */
const getStatsCached = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data: stats, error } = await (supabase as any).rpc('get_dashboard_analytics', { 
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
  ['dashboard-stats'], // Official identification prefix
  {
    revalidate: 3600,
    tags: ['dashboard-stats']
  }
)

export async function getCachedDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized access")

  const stats = await getStatsCached(user.id)
  
  return stats || {
    revenue: 0, revenue_change: 0, unpaid: 0, unpaid_count: 0,
    acceptedCount: 0, quotes_change: 0, history: []
  }
}

/** 👤 USER PROFILE */
const getProfileCached = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company_name, email, is_pro, preferred_language')
      .eq('id', userId)
      .single()
    return error ? null : data
  },
  ['user-profile'],
  { revalidate: 60, tags: ['user-profile'] }
)

export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return getProfileCached(user.id)
}

/** 📄 RECENT ACTIVITY */
const getRecentQuotesCached = unstable_cache(
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
    return error ? [] : data
  },
  ['recent-activity'],
  { revalidate: 3600, tags: ['recent-activity'] }
)

export async function getCachedRecentQuotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  return getRecentQuotesCached(user.id)
}
