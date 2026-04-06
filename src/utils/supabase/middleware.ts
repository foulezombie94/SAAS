import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
  // 1. On initialise la réponse par défaut
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // 2. Client Supabase avec gestion synchrone des cookies
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
            request.cookies.set(name, value)
            supabaseResponse = NextResponse.next({
              request,
            })
            supabaseResponse.cookies.set(name, value, {
              ...options,
              // On laisse Supabase gérer le httpOnly
              maxAge: 2592000,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          })
        },
      },
    }
  )

  // 3. Rafraîchissement de session (CRITIQUE pour le SSR et les Server Actions)
  const { data: { user } } = await supabase.auth.getUser()

  const isProtectedPath = 
    request.nextUrl.pathname.startsWith('/dashboard') || 
    request.nextUrl.pathname.startsWith('/onboarding') ||
    (request.nextUrl.pathname.startsWith('/api') && 
     !request.nextUrl.pathname.startsWith('/api/webhooks') && 
     !request.nextUrl.pathname.startsWith('/api/revalidate-profile'))

  // 🛡️ CAS 1 : Utilisateur NON connecté sur une route protégée
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 🛡️ CAS 2 : Utilisateur CONNECTÉ
  if (user) {
    // Audit rapide du profil
    const { data: profile } = await supabase
      .from('profiles')
      .select('plan')
      .eq('id', user.id)
      .single()

    const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding')
    const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')

    // A. Redirection Onboarding si pas de plan
    if (!profile?.plan && !isOnboardingPath && isDashboardPath) {
      const url = request.nextUrl.clone()
      url.pathname = '/onboarding/transition'
      const redirectResponse = NextResponse.redirect(url)
      // On transfère les cookies de session rafraîchis
      supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c))
      return redirectResponse
    }

    // B. Redirection vers Dashboard si sur "/"
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = profile?.plan ? '/dashboard' : '/onboarding/transition'
      const redirectResponse = NextResponse.redirect(url)
      // On transfère les cookies de session rafraîchis
      supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c))
      return redirectResponse
    }
  }

  return supabaseResponse
}
