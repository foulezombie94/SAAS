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
              maxAge: 315360000, // 10 ans (Infinie)
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
  const { data: { user } } = await supabase.auth.getUser()

  // REDIRECTION INTELLIGENTE: Si connecté et sur la page d'accueil, go Dashboard
  if (user && request.nextUrl.pathname === '/') {
    const url = request.nextUrl.clone()
    url.pathname = '/dashboard'
    const redirectRes = NextResponse.redirect(url)
    // TRANSFÉRER LES COOKIES: Crucial pour ne pas perdre la session pendant le saut
    response.cookies.getAll().forEach((cookie) => {
      const { name, value, ...options } = cookie
      redirectRes.cookies.set(name, value, options)
    })
    return redirectRes
  }

  return response
}
