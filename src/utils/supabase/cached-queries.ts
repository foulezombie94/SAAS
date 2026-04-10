import { createClient } from './server'
import { unstable_cache } from 'next/cache'
import { DashboardStats, ClientWithQuotes, Quote } from '@/types/dashboard'

/**
 * 💹 DASHBOARD STATS
 * Hardened Multi-tenant Isolation: userId is EXPLICITLY part of the key.
 */
export const getCachedDashboardStats = (userId: string) => unstable_cache(
  async (uid: string): Promise<DashboardStats> => {
    const supabase = await createClient()
    const { data: stats, error } = await (supabase as any).rpc('get_dashboard_analytics', { 
      p_user_id: uid 
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
  ['dashboard-stats', userId], // ✅ SECURE KEY ISOLATION
  { 
    revalidate: 3600, 
    tags: ['dashboard-stats'] 
  }
)(userId)

/** 👤 USER PROFILE */
export const getUserProfile = (userId: string) => unstable_cache(
  async (uid: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('profiles')
      .select('id, first_name, last_name, company_name, email, is_pro, preferred_language')
      .eq('id', uid)
      .single()
    
    return error ? null : data
  },
  ['user-profile', userId], // ✅ SECURE KEY ISOLATION
  { revalidate: 3600, tags: ['user-profile'] }
)(userId)

/** 📄 RECENT ACTIVITY */
export const getCachedRecentQuotes = (userId: string) => unstable_cache(
  async (uid: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select(`
        id, number, status, total_ttc, created_at, 
        clients (name)
      `)
      .eq('user_id', uid)
      .order('created_at', { ascending: false })
      .limit(10)

    return error ? [] : data
  },
  ['recent-activity', userId], // ✅ SECURE KEY ISOLATION
  { revalidate: 3600, tags: ['recent-activity'] }
)(userId)

/** 🧾 ALL INVOICES */
export const getCachedInvoices = (userId: string) => unstable_cache(
  async (uid: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('invoices')
      .select('*, clients(*)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    return error ? [] : data
  },
  ['all-invoices', userId], // ✅ SECURE KEY ISOLATION
  { revalidate: 3600, tags: ['all-invoices'] }
)(userId)

/** 📂 ALL QUOTES */
export const getCachedAllQuotes = (userId: string) => unstable_cache(
  async (uid: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('quotes')
      .select('*, clients(name)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    return (error ? [] : data) as Quote[]
  },
  ['all-quotes', userId], // ✅ SECURE KEY ISOLATION
  { revalidate: 3600, tags: ['all-quotes'] }
)(userId)

/** 👥 ALL CLIENTS */
export const getCachedClients = (userId: string) => unstable_cache(
  async (uid: string) => {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('clients')
      .select('*, quotes(id, status, total_ttc, created_at)')
      .eq('user_id', uid)
      .order('created_at', { ascending: false })

    return (error ? [] : data) as ClientWithQuotes[]
  },
  ['all-clients', userId], // ✅ SECURE KEY ISOLATION
  { revalidate: 3600, tags: ['all-clients'] }
)(userId)
