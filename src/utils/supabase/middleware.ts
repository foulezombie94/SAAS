import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            // 1. On met à jour la requête pour que les composants serveur voient les cookies
            request.cookies.set(name, value)
            // 2. On met à jour la réponse pour que le navigateur stocke les cookies
            response.cookies.set(name, value, {
              ...options,
              maxAge: 60 * 60 * 24 * 30, // 30 jours
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          })
        },
      },
    }
  )

  // This will refresh the session if expired - critical for SSR
  await supabase.auth.getUser()

  return response
}
