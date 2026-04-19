import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * 🛠️ PRIVILEGED ADMIN CLIENT (Service Role)
 * 
 * Bypasses Row Level Security (RLS).
 * Optimized to NOT crash globally if environment variables are missing.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  if (!serviceRoleKey || !supabaseUrl) {
    return null
  }

  return createClient<Database>(
    supabaseUrl,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}

/**
 * 🔒 FAIL-SOFT PATTERN
 * 
 * Use this in critical server actions/routes where the Admin Client is mandatory.
 * Throws a 'SERVICE_UNAVAILABLE' error if keys are missing, which can be 
 * caught to provide a clean UI fallback instead of a generic 500 error.
 */
export function requireAdminClient() {
  const adminClient = createAdminClient()
  
  if (!adminClient) {
    console.warn('⚠️ [ArtisanFlow] Supabase Admin Client requested but keys are missing.')
    throw new Error('SERVICE_UNAVAILABLE')
  }

  return adminClient
}
