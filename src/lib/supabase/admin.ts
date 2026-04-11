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

  if (!serviceRoleKey) {
    throw new Error(
      "[SECURITY CRITICAL] Missing SUPABASE_SERVICE_ROLE_KEY. Administrative operations aborted."
    );
  }

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    {
      cookies: {
        getAll: () => [],
        setAll: () => {}, // Admin client is stateless regarding session cookies
      },
    }
  )
}
