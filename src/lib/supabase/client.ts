import "server-only"
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { Database } from '@/types/supabase'

/**
 * 🛰️ STANDARD AUTHENTICATED CLIENT (SSR)
 * 
 * Used in Server Components, Route Handlers, and Server Actions.
 * Handles automatic session refreshing via cookies.
 * 
 * IMPORTANT: In Next.js 15+, cookies() is ASYNCHRONOUS.
 * We must await it to avoid type errors during build.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => cookieStore.getAll(),
        setAll: (cookiesToSet) => {
          try {
            cookiesToSet.forEach(({ name, value, options }) => {
              cookieStore.set(name, value, {
                ...options,
                httpOnly: true,
                secure: process.env.NODE_ENV === "production",
                sameSite: "lax",
                path: "/",
              })
            })
          } catch (error) {
            // The `setAll` method was called from a Server Component.
            // This can be ignored since the middleware is handling session refresh.
            if (process.env.NODE_ENV === "development") {
              console.warn("Supabase cookie set failed (expected in Server Components):", error)
            }
          }
        },
    }
  )
}
