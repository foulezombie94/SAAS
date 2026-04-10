import { unstable_cache } from 'next/cache'
import { createClient } from './server'
import { DashboardStats } from '@/types/dashboard'

/**
 * Récupère les statistiques du dashboard avec cache serveur.
 * 🛡️ GRADE 3 : Sécurisation par session et agrégation atomique (prochainement RPC).
 */
export async function getCachedDashboardStats(): Promise<DashboardStats> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error("Unauthorized access")

  return unstable_cache(
    async () => {
      // 🏎️ GRADE 3 : Agrégation atomique côté SQL (Ultra-Performance)
      const { data: stats, error } = await (supabase as any).rpc('get_dashboard_analytics', { 
        p_user_id: user.id 
      })

      if (error || !stats) {
        console.error('[STATS ERROR]', error || 'No data returned')
        // Fallback vide mais typé
        return {
          revenue: 0,
          revenue_change: 0,
          unpaid: 0,
          unpaid_count: 0,
          acceptedCount: 0,
          quotes_change: 0,
          history: []
        }
      }

      // 🛡️ Final Safety Layer: Ensure all required fields exist
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
    ['dashboard-stats', user.id],
    {
      revalidate: 3600, // 🏎️ Edge-optimized (1h) - Combined with on-demand revalidatePath
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
        .select('id, first_name, last_name, company_name, email, is_pro, preferred_language') // 🛡️ NO SMTP/IBAN
        .eq('id', user.id)
        .single()
      return data
    },
    ['user-profile', user.id],
    {
      revalidate: 60, // 🏎️ Reduced for dev-responsive manual DB changes
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
      revalidate: 3600, // 🏎️ Edge-optimized (1h)
      tags: [`dashboard-stats-${user.id}`]
    }
  )()
}
