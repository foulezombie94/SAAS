import { createClient } from './server'
import { hardenedCache } from './hardened-cache'
import { DashboardStats, ClientWithQuotes, Quote } from '@/types/dashboard'

/**
 * 💹 DASHBOARD STATS (Grade 3 - Zero Smell)
 * Freshness: 15 minutes (900s)
 */
export const getCachedDashboardStats = hardenedCache(
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

    // Explicit transformer to avoid 'as any'
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
  (userId) => ['dashboard-stats', userId],
  { revalidate: 900, tags: ['dashboard-stats'] }
)

/** 👤 USER PROFILE (Grade 3 - Zero Smell) */
export const getUserProfile = hardenedCache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company_name, email, is_pro, preferred_language')
      .eq('id', userId)
      .single()
    
    return error ? null : data
  },
  (userId) => ['user-profile', userId],
  { revalidate: 3600, tags: ['user-profile'] }
)

/** 📄 RECENT ACTIVITY (Grade 3 - Zero Smell) */
export const getCachedRecentQuotes = hardenedCache(
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
    
    // Explicit return typing
    return data as (Quote & { clients: { name: string } })[]
  },
  (userId) => ['recent-activity', userId],
  { revalidate: 3600, tags: ['recent-activity'] }
)

/** 🧾 ALL INVOICES (Grade 3 - Zero Smell) */
export const getCachedInvoices = hardenedCache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients:client_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error || !data ? [] : data
  },
  (userId) => ['all-invoices', userId],
  { revalidate: 3600, tags: ['all-invoices'] }
)

/** 📂 ALL QUOTES (Grade 3 - Zero Smell) */
export const getCachedAllQuotes = hardenedCache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients:client_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error || !data ? [] : (data as Quote[])
  },
  (userId) => ['all-quotes', userId],
  { revalidate: 3600, tags: ['all-quotes'] }
)

/** 👥 ALL CLIENTS (Grade 3 - Zero Smell) */
export const getCachedClients = hardenedCache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*, quotes:quotes(id, status, total_ttc, created_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error || !data ? [] : (data as ClientWithQuotes[])
  },
  (userId) => ['all-clients', userId],
  { revalidate: 3600, tags: ['all-clients'] }
)
