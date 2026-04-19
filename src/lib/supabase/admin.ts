import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * 🛠️ PRIVILEGED ADMIN CLIENT (Service Role)
 * 
 * Bypasses Row Level Security (RLS).
 * ONLY use for background tasks, administrative overrides, and system-level operations.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceRoleKey) {
    throw new Error(
      `[SECURITY CRITICAL] Supabase Service Role Key is missing in ${process.env.NODE_ENV} environment.`
    )
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  )
}
