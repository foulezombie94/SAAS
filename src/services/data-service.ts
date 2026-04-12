import { createClient } from '@/utils/supabase/server'
import { DashboardStats, ClientWithQuotes, Quote } from '@/types/dashboard'

/**
 * 🛰️ RAW DATA SERVICE (Level 18.5+)
 * 
 * Responsibility: Pure database communication with strict type safety.
 * Constraint: NO caching logic here. NO lazy casting.
 * Flexibility: Allows client injection for background/cached operations.
 */

export const DataService = {
  /** 📊 DASHBOARD ANALYTICS */
  async fetchDashboardStats(userId: string, supabase?: any): Promise<DashboardStats> {
    const client = supabase || await createClient()
    const { data, error } = await client.rpc('get_dashboard_analytics', { 
      p_user_id: userId 
    })

    if (error || !data) {
      console.error('[SERVICE ERROR] fetchDashboardStats:', error || 'No data')
      return {
        revenue: 0, revenue_change: 0, unpaid: 0, unpaid_count: 0,
        acceptedCount: 0, quotes_change: 0, history: []
      }
    }

    const payload = data as any
    return {
      revenue: Number(payload.revenue ?? 0),
      revenue_change: Number(payload.revenue_change ?? 0),
      unpaid: Number(payload.unpaid ?? 0),
      unpaid_count: Number(payload.unpaid_count ?? 0),
      acceptedCount: Number(payload.acceptedCount ?? 0),
      quotes_change: Number(payload.quotes_change ?? 0),
      history: Array.isArray(payload.history) ? payload.history : []
    }
  },

  /** 👤 USER PROFILE */
  async fetchUserProfile(userId: string, supabase?: any) {
    const client = supabase || await createClient()
    const { data, error } = await client
      .from('profiles')
      .select('id, first_name, last_name, company_name, email, address, phone, siret, iban, bic, bank_name, business_description, legal_form, tva_intra, statement_descriptor, is_pro, preferred_language')
      .eq('id', userId)
      .single()
    
    if (error) {
      console.warn('[SERVICE WARNING] fetchUserProfile:', error.message)
      return null
    }
    return data
  },

  /** 📄 RECENT QUOTES (WITH CLIENTS) */
  async fetchRecentQuotes(userId: string, supabase?: any) {
    const client = supabase || await createClient()
    const { data, error } = await client
      .from('quotes')
      .select('id, number, status, total_ttc, created_at, clients:client_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(10)

    if (error || !data) return []
    return data.map((q: any) => ({
      ...q,
      clients: Array.isArray(q.clients) ? q.clients[0] : q.clients
    })) as (Quote & { clients: { name: string } })[]
  },

  /** 🧾 ALL INVOICES */
  async fetchInvoices(userId: string, supabase?: any) {
    const client = supabase || await createClient()
    const { data, error } = await client
      .from('invoices')
      .select('*, clients:client_id(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data
  },

  /** 📂 ALL QUOTES */
  async fetchAllQuotes(userId: string, supabase?: any): Promise<Quote[]> {
    const client = supabase || await createClient()
    const { data, error } = await client
      .from('quotes')
      .select('*, clients:client_id(name)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as unknown as Quote[]
  },

  /** 👥 ALL CLIENTS */
  async fetchClients(userId: string, supabase?: any): Promise<ClientWithQuotes[]> {
    const client = supabase || await createClient()
    const { data, error } = await client
      .from('clients')
      .select('*, quotes:quotes(id, status, total_ttc, created_at)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })

    if (error || !data) return []
    return data as unknown as ClientWithQuotes[]
  }
}
