import { createClient } from '@supabase/supabase-js'
import { Database } from '@/types/supabase'

export function createAdminClient() {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!serviceKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is missing! Payment updates will fail due to RLS. Please add it to Vercel Environment Variables.")
  }

  return createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceKey,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }
  )
}
