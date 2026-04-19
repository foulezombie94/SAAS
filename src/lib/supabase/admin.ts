import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

/**
 * 🛠️ PRIVILEGED ADMIN CLIENT (Service Role) - RESILIENT VERSION
 * 
 * Bypasses Row Level Security (RLS).
 * Optimized to NOT crash if environment variables are missing.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL

  // 🛡️ RESILIENCE: If keys are missing, return a Proxy that prevents crashing
  if (!serviceRoleKey || !supabaseUrl) {
    console.error('⚠️ [ArtisanFlow] Supabase Admin Keys missing. Returning safety proxy.')
    
    // This Proxy intercepts all property access and returns a function that does nothing
    // or returns a value that won't crash common patterns (like .auth.admin...)
    const safetyHandler: ProxyHandler<any> = {
      get(target, prop) {
        if (typeof target[prop] === 'object' && target[prop] !== null) {
          return new Proxy(target[prop], safetyHandler)
        }
        return (...args: any[]) => {
          console.warn(`🚫 [ArtisanFlow] Call to adminClient.${String(prop)} ignored (Keys missing)`)
          return Promise.resolve({ data: null, error: { message: 'Admin keys missing' } })
        }
      }
    }

    return new Proxy({ auth: { admin: {} }, from: () => ({ select: () => ({}) }) }, safetyHandler) as any
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
