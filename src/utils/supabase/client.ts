import { createBrowserClient } from '@supabase/ssr'
import { Database } from '@/types/supabase'

let client: ReturnType<typeof createBrowserClient<Database>> | undefined

export function createClient() {
  if (client) return client

  client = createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        // 🔑 Auto-refresh the JWT token before it expires (prevents disconnect after ~1h inactivity)
        autoRefreshToken: true,
        // 💾 Keep session alive in localStorage across tabs
        persistSession: true,
        // 🔗 Detect OAuth/magic-link tokens in the URL
        detectSessionInUrl: true,
      }
    }
  )
  
  return client
}
