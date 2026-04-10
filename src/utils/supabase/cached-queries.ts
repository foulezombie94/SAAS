import { createClient } from './server'
import { seniorCache } from './hardened-cache'
import { DashboardStats, ClientWithQuotes, Quote } from '@/types/dashboard'

/**
 * 💹 DASHBOARD STATS (Senior SaaS Mode)
 * Isolation: AUTOMATIC ([namespace, userId])
 * Invalidation: Global tag 'dashboard-stats'
 */
export const getCachedDashboardStats = seniorCache(
  'dashboard-stats',
  async (userId: string): Promise<DashboardStats> => {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_dashboard_analytics', { 
      p_user_id: userId 
    })

    if (error || !data) {
      console.error('[STATS ERROR]', error || 'No data returned')
      return {
        revenue: 0, revenue_change: 0, unpaid: 0, unpaid_count: 0,
        acceptedCount: 0, quotes_change: 0, history: []
      }
    }

    const s = data as Record<string, unknown>
    return {
      revenue: Number(s.revenue ?? 0),
      revenue_change: Number(s.revenue_change ?? 0),
      unpaid: Number(s.unpaid ?? 0),
      unpaid_count: Number(s.unpaid_count ?? 0),
      acceptedCount: Number(s.acceptedCount ?? 0),
      quotes_change: Number(s.quotes_change ?? 0),
      history: Array.isArray(s.history) ? s.history : []
    }
  },
  { revalidate: 900, tags: ['dashboard-stats'] }
)

/** 👤 USER PROFILE (Senior SaaS Mode) */
export const getUserProfile = seniorCache(
  'user-profile',
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company_name, email, is_pro, preferred_language')
      .eq('id', userId)
      .single()
    
    return error ? null : data
  },
  { revalidate: 3600, tags: ['user-profile'] }
)

/** 📄 RECENT ACTIVITY (Senior SaaS Mode) */
export const getCachedRecentQuotes = seniorCache(
  'recent-activity',
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id, number, status, total_ttc, created_at, 
        clients:client_id (name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error || !data) return []
    return data as (Quote & { clients: { name: string } })[]
  },
  { revalidate: 3600, tags: ['recent-activity'] }
)

/** 🧾 ALL INVOICES (Senior SaaS Mode) */
export const getCachedInvoices = seniorCache(
  'all-invoices',
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients:client_id(*) ')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error || !data ? [] : data
  },
  { revalidate: 3600, tags: ['all-invoices'] }
)

/** 📂 ALL QUOTES (Senior SaaS Mode) */
export const getCachedAllQuotes = seniorCache(
  'all-quotes',
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients:client_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error || !data ? [] : (data as Quote[])
  },
  { revalidate: 3600, tags: ['all-quotes'] }
)

/** 👥 ALL CLIENTS (Senior SaaS Mode) */
export const getCachedClients = seniorCache(
  'all-clients',
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*, quotes:quotes(id, status, total_ttc, created_at) ')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error || !data ? [] : (data as ClientWithQuotes[])
  },
  { revalidate: 3600, tags: ['all-clients'] }
)
