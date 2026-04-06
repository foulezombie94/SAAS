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
      // 🏎️ GRADE 3 : Agrégation atomique côté SQL (Ultra-Performance)
      const { data: stats, error } = await supabase.rpc('get_dashboard_analytics', { 
        p_user_id: user.id 
      })

      if (error) {
        console.error('[STATS ERROR]', error)
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

      return stats
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
      revalidate: 60,
      tags: [`dashboard-stats-${user.id}`]
    }
  )()
}
