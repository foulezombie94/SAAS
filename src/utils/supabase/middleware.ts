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
  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding')
    const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')

    // If no plan, force onboarding (unless already on onboarding path)
    if (!profile?.plan && !isOnboardingPath && isDashboardPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/transition'
      return NextResponse.redirect(url)
    }

    // If on home page and logged in, go to dashboard (or onboarding)
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = profile?.plan ? '/dashboard' : '/onboarding/transition'
      const redirectRes = NextResponse.redirect(url)
      response.cookies.getAll().forEach((cookie) => {
        const { name, value, ...options } = cookie
        redirectRes.cookies.set(name, value, options)
      })
      return redirectRes
    }
  } else {
    // PROTECT ROUTES: If NOT logged in and trying to access protected areas
    const isProtectedPath = 
      request.nextUrl.pathname.startsWith('/dashboard') || 
      request.nextUrl.pathname.startsWith('/onboarding') ||
      (request.nextUrl.pathname.startsWith('/api') && !request.nextUrl.pathname.startsWith('/api/webhooks'))

    if (isProtectedPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/login'
      return NextResponse.redirect(url)
    }
  }

  return response
}
