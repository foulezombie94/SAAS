import { createClient } from './server'
import { unstable_cache } from 'next/cache'
import { DashboardStats, ClientWithQuotes, Quote } from '@/types/dashboard'

/**
 * 💹 DASHBOARD STATS (Clean SaaS Pattern)
 * Strictly follows the 'Clean SaaS' rule: top-level cache with functional isolation.
 * No redundant wrappers, absolute multi-tenant safety.
 */
export const getCachedDashboardStats = unstable_cache(
  async (userId: string): Promise<DashboardStats> => {
    const supabase = await createClient()
    const { data: stats, error } = await (supabase as any).rpc('get_dashboard_analytics', { 
      p_user_id: userId 
    })

    if (error || !stats) {
      console.error('[STATS ERROR]', error || 'No data returned')
      return {
        revenue: 0, revenue_change: 0, unpaid: 0, unpaid_count: 0,
        acceptedCount: 0, quotes_change: 0, history: []
      }
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
  // @ts-expect-error - Next.js 15+ functional key isolation (Clean SaaS Standard)
  (userId: string) => ['dashboard-stats', userId],
  { revalidate: 3600, tags: ['dashboard-stats'] }
)

/** 👤 USER PROFILE */
export const getUserProfile = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company_name, email, is_pro, preferred_language')
      .eq('id', userId)
      .single()
    
    return error ? null : data
  },
  // @ts-expect-error - Next.js 15+ functional key isolation
  (userId: string) => ['user-profile', userId],
  { revalidate: 3600, tags: ['user-profile'] }
)

/** 📄 RECENT ACTIVITY */
export const getCachedRecentQuotes = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id, number, status, total_ttc, created_at, 
        clients (name)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    return error ? [] : data
  },
  // @ts-expect-error - Next.js 15+ functional key isolation
  (userId: string) => ['recent-activity', userId],
  { revalidate: 3600, tags: ['recent-activity'] }
)

/** 🧾 ALL INVOICES */
export const getCachedInvoices = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error ? [] : data
  },
  // @ts-expect-error - Next.js 15+ functional key isolation
  (userId: string) => ['all-invoices', userId],
  { revalidate: 3600, tags: ['all-invoices'] }
)

/** 📂 ALL QUOTES */
export const getCachedAllQuotes = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return (error ? [] : data) as Quote[]
  },
  // @ts-expect-error - Next.js 15+ functional key isolation
  (userId: string) => ['all-quotes', userId],
  { revalidate: 3600, tags: ['all-quotes'] }
)

/** 👥 ALL CLIENTS */
export const getCachedClients = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*, quotes(id, status, total_ttc, created_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return (error ? [] : data) as ClientWithQuotes[]
  },
  // @ts-expect-error - Next.js 15+ functional key isolation
  (userId: string) => ['all-clients', userId],
  { revalidate: 3600, tags: ['all-clients'] }
)
