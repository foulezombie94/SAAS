import { createClient } from '@/utils/supabase/server'

/**
 * Vérifie si l'utilisateur actuel a un abonnement Pro actif.
 * @returns {Promise<{ isPro: boolean, userId: string }>}
 */
export async function verifyProAccess() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  if (!user) {
    throw new Error('Non autorisé')
  }

  const { data: profile, error } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single()

  if (error || !profile) {
    return { isPro: false, userId: user.id }
  }

  return { isPro: !!profile.is_pro, userId: user.id }
}

/**
 * Middleware-like check for Server Actions or API Routes.
 * Throws an error if the user is not Pro.
 */
export async function ensurePro() {
  const { isPro } = await verifyProAccess()
  if (!isPro) {
    throw new Error('Cette fonctionnalité est réservée aux membres ArtisanFlow Pro. Veuillez mettre à niveau votre abonnement.')
  }
}
