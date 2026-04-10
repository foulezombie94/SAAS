import { createClient } from './server'
import { unstable_cache } from 'next/cache'
import { DashboardStats, ClientWithQuotes, Quote } from '@/types/dashboard'
import { Database } from '@/types/supabase'

/**
 * 💹 DASHBOARD STATS (Clean SaaS Pattern - Grade 3)
 * Freshness: 15 minutes (900s)
 * Isolation: Explicit functional key parts.
 */
export const getCachedDashboardStats = unstable_cache(
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

    const stats = data as any // RPC Returns Json from Database interface

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
  // @ts-expect-error - Next.js 16 functional key isolation (SaaS Standard)
  (userId: string) => ['dashboard-stats', userId],
  { revalidate: 900, tags: ['dashboard-stats'] }
)

/** 👤 USER PROFILE (Grade 3) */
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
  // @ts-expect-error
  (userId: string) => ['user-profile', userId],
  { revalidate: 3600, tags: ['user-profile'] }
)

/** 📄 RECENT ACTIVITY (Grade 3) */
export const getCachedRecentQuotes = unstable_cache(
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

    return (error ? [] : data) as unknown as (Quote & { clients: { name: string } })[]
  },
  // @ts-expect-error
  (userId: string) => ['recent-activity', userId],
  { revalidate: 3600, tags: ['recent-activity'] }
)

/** 🧾 ALL INVOICES (Grade 3) */
export const getCachedInvoices = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients:client_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return error ? [] : data
  },
  // @ts-expect-error
  (userId: string) => ['all-invoices', userId],
  { revalidate: 3600, tags: ['all-invoices'] }
)

/** 📂 ALL QUOTES (Grade 3) */
export const getCachedAllQuotes = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients:client_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return (error ? [] : data) as Quote[]
  },
  // @ts-expect-error
  (userId: string) => ['all-quotes', userId],
  { revalidate: 3600, tags: ['all-quotes'] }
)

/** 👥 ALL CLIENTS (Grade 3) */
export const getCachedClients = unstable_cache(
  async (userId: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*, quotes:quotes(id, status, total_ttc, created_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    return (error ? [] : data) as ClientWithQuotes[]
  },
  // @ts-expect-error
  (userId: string) => ['all-clients', userId],
  { revalidate: 3600, tags: ['all-clients'] }
)
