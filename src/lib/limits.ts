import { createClient } from '@/utils/supabase/server'

export async function checkLimits(table: 'clients' | 'quotes' | 'invoices') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) throw new Error("Non autorisé")

  // 1. Récupérer le statut du profil
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single()

  // 2. Si c'est un membre PRO, pas de limite
  if (profile?.is_pro) return { allowed: true, count: 0, isPro: true }

  // 3. Compter les éléments existants
  const { count, error } = await supabase
    .from(table)
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (error) {
    console.error(`Error checking limits for ${table}:`, error)
    return { allowed: false, count: 0, isPro: false }
  }

  // 4. Vérifier la limite de 3
  if (count !== null && count >= 3) {
    return { allowed: false, count, isPro: false }
  }

  return { allowed: true, count: count || 0, isPro: false }
}
