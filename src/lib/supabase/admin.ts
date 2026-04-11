import "server-only"
import { createServerClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

/**
 * 🛠️ PRIVILEGED ADMIN CLIENT (Server-Side Only)
 * 
 * Bypasses Row Level Security (RLS). 
 * ONLY use for background tasks, administrative overrides, and system-level operations.
 * NEVER expose to the client bundle.
 */
export function createAdminClient() {
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  // 🛡️ SECURITY GUARD: Service role key is MANDATORY in production
  if (process.env.NODE_ENV === "production" && !serviceRoleKey) {
    throw new Error(
      "[SECURITY CRITICAL] Supabase Service Role Key is missing in production environment."
    );
  }

  // Fallback for development if key is missing but logic is called
  if (!serviceRoleKey) {
    throw new Error("[SECURITY] Missing SUPABASE_SERVICE_ROLE_KEY.");
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {
          // 🛡️ INTENTIONALLY DISABLED: Admin client is stateless and bypasses auth session.
        },
      },
    }
  )
}
