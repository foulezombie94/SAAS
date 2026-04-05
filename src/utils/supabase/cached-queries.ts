import { unstable_cache } from 'next/cache'
import { createClient } from './server'

/**
 * Récupère les statistiques du dashboard avec cache serveur.
 * 🛡️ GRADE 3 : Sécurisation par session et agrégation atomique (prochainement RPC).
 */
export async function getCachedDashboardStats() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized access")

  return unstable_cache(
    async () => {
      // 🏎️ TENTATIVE ÉLITE : Agrégation côté SQL (RPC Grade 3)
      const { data: stats, error: rpcError } = await (supabase as any).rpc('get_dashboard_summary', { 
        p_user_id: user.id 
      })

      // ✨ FALLBACK : Si le RPC n'est pas encore créé, on utilise le reduce JS
      if (!rpcError && stats) {
        return stats
      }

      // 🛡️ SECURITY : ID session-only (Anti-IDOR)
      const [quotesRes, invoicesRes] = await Promise.all([
        supabase
          .from('quotes')
          .select('id, status, total_ttc')
          .eq('user_id', user.id),
        supabase
          .from('invoices')
          .select('id, status, total_ttc')
          .eq('user_id', user.id)
      ])

      const quotes = quotesRes.data || []
      const invoices = invoicesRes.data || []

      return {
        revenue: quotes.reduce((acc, q) => acc + (q.status === 'accepted' || q.status === 'invoiced' ? (q.total_ttc || 0) : 0), 0),
        unpaid: invoices.reduce((acc, i) => acc + (i.status !== 'paid' ? (i.total_ttc || 0) : 0), 0),
        acceptedCount: quotes.filter(q => q.status === 'accepted').length,
        totalInvoices: invoices.length
      }
    },
    ['dashboard-stats', user.id],
    {
      revalidate: 60,
      tags: [`dashboard-stats-${user.id}`]
    }
  )()
}

/**
 * Récupère le profil utilisateur avec cache.
 * 🛡️ GRADE 3 : Filtrage strict (Anti-DataLeak) et session-first.
 */
export async function getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  return unstable_cache(
    async () => {
      const { data } = await supabase
        .from('profiles')
        .select('id, first_name, last_name, company_name, email, is_pro') // 🛡️ NO SMTP/IBAN
        .eq('id', user.id)
        .single()
      return data
    },
    ['user-profile', user.id],
    {
      revalidate: 300,
      tags: [`profile-${user.id}`]
    }
  )()
}

/**
 * Récupère les activités récentes mis en cache.
 * 🛡️ GRADE 3 : Sécurisation session-first.
 */
export async function getCachedRecentQuotes() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  return unstable_cache(
    async () => {
      const { data } = await supabase
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
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10)
      return data || []
    },
    ['recent-quotes', user.id],
    {
      revalidate: 60,
      tags: [`dashboard-stats-${user.id}`]
    }
  )()
}
