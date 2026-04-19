import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'
import { redis } from '@/lib/rate-limit'
import { createAdminClient, requireAdminClient } from '@/lib/supabase/admin'

export async function updateSession(request: NextRequest, requestHeaders?: Headers) {
  // 1. On initialise la réponse par défaut avec les headers passés (pour le nonce CSP)
  let supabaseResponse = NextResponse.next({
    request: {
      headers: requestHeaders || request.headers,
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
          // 1. On synchronise tous les cookies sur la requête pour les Server Components
          // Note : on ne recrée plus la réponse pour éviter d'écraser des headers (nonce, CSP)
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value))
          
          // 2. On applique chaque cookie directement sur la réponse existante (Mutation)
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              maxAge: 2592000,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax',
              path: '/',
            })
          )
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
     !request.nextUrl.pathname.startsWith('/api/revalidate-profile') &&
     !request.nextUrl.pathname.startsWith('/api/quotes/view') &&
     !request.nextUrl.pathname.startsWith('/api/quotes/accept') &&
     !request.nextUrl.pathname.startsWith('/api/quotes/public') &&
     !request.nextUrl.pathname.startsWith('/api/quotes/download-pdf') &&
     !request.nextUrl.pathname.startsWith('/api/payments/create-session'))

  // 🛡️ CAS 1 : Utilisateur NON connecté sur une route protégée
  if (!user && isProtectedPath) {
    const url = request.nextUrl.clone()
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // 🛡️ CAS 2 : Utilisateur CONNECTÉ
  if (user) {
    // 🚀 Redirection vers Dashboard si sur "/" ou "/login" (Auto-login persistence)
    if (request.nextUrl.pathname === '/' || request.nextUrl.pathname === '/login') {
      let plan = user.app_metadata?.plan
      if (!plan) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()
        plan = profile?.plan
      }
      const url = request.nextUrl.clone()
      url.pathname = plan ? '/dashboard' : '/onboarding/transition'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c))
      return redirectResponse
    }

    // 🔒 Logique pour les routes protégées (Dashboard/Onboarding)
    if (isProtectedPath) {
      // 🛑 INSTANT BAN CHECK (Redis) - Throttled by cookie to 10m
      if (redis) {
        const banSynced = request.cookies.get('af_ban_synced')
        
        if (!banSynced) {
          const isBanned = await redis.get(`artisan-flow:ban:${user.id}`)
          if (isBanned) {
            const url = request.nextUrl.clone()
            url.pathname = '/'
            url.searchParams.set('error', 'banned')
            const response = NextResponse.redirect(url)
            
            // 🛡️ DYNAMISME : On supprime tous les cookies auth Supabase sans coder l'ID projet 
            request.cookies.getAll().forEach(cookie => {
              if (cookie.name.startsWith('sb-') && cookie.name.endsWith('-auth-token')) {
                response.cookies.delete(cookie.name)
              }
            })
            
            return response
          }

          supabaseResponse.cookies.set('af_ban_synced', 'true', {
            maxAge: 600,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          })
        }
      }

      // 🏎️ Plan verification
      let plan = user.app_metadata?.plan
      if (!plan) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('plan')
          .eq('id', user.id)
          .single()
        plan = profile?.plan
      }

      const isOnboardingPath = request.nextUrl.pathname.startsWith('/onboarding')
      const isDashboardPath = request.nextUrl.pathname.startsWith('/dashboard')

      // A. Redirection Onboarding si pas de plan
      if (!plan && !isOnboardingPath && isDashboardPath) {
        const url = request.nextUrl.clone()
        url.pathname = '/onboarding/transition'
        const redirectResponse = NextResponse.redirect(url)
        supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c))
        return redirectResponse
      }

      // B. 🛡️ ACTIVITY TRACKING (SITE ENTRY ONLY)
      const lastSeenSync = request.cookies.get('af_last_seen_sync')
      
      if (!lastSeenSync) {
        try {
          const supabaseAdmin = requireAdminClient()!
          
          await supabaseAdmin.auth.admin.updateUserById(user.id, {
            app_metadata: { last_seen_at: new Date().toISOString() }
          })

          // Cookie de 24 heures
          supabaseResponse.cookies.set('af_last_seen_sync', 'true', {
            maxAge: 86400,
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'lax'
          })
        } catch (e: any) {
          if (e.message === 'SERVICE_UNAVAILABLE') {
            console.warn('⚠️ [MIDDLEWARE] Tracking activité ignoré : Service Admin indisponible.')
          } else {
            console.error('⚠️ [MIDDLEWARE] Tracking activité échoué:', e.message)
          }
          // Fail-Soft: On ne bloque pas la réponse si le tracking échoue
        }
      }
    }
  }

  return supabaseResponse
}
