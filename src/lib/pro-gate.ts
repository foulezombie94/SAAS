import { createClient } from '@/utils/supabase/server'
import { cache } from 'react'

/**
 * 🛰️ PRO ACCESS VERIFIER (Grade 4)
 * 
 * Pattern: Request-scoped cache (deduplication).
 * Note: cache() is valid ONLY within the React render tree ( RSC / Actions ).
 * In Route Handlers (API routes), this will hit the DB directly each time.
 */
export const verifyProAccess = cache(async () => {
  const supabase = await createClient()
  
  // 🛡️ Explicit Auth Check
  const { data: { user }, error: authError } = await supabase.auth.getUser()

  if (authError || !user) {
    console.error('[AUTH ERROR] verifyProAccess:', authError?.message)
    return { isPro: false, userId: null, error: 'User not found or session expired' }
  }

  // 🕵️ Profile Selection
  const { data: profile, error: dbError } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', user.id)
    .single()

  if (dbError || !profile) {
    console.warn('[DB WARNING] verifyProAccess:', dbError?.message)
    return { isPro: false, userId: user.id }
  }

  return { isPro: !!profile.is_pro, userId: user.id }
})

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
