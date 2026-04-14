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
              httpOnly: true,
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
    // 🚀 SENIOR OPTIMIZATION (GRADE 3): Prioritize JWT metadata (Zero-DB hit)
    // We only query the database if the metadata is not yet synchronized.
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

    // B. Redirection vers Dashboard si sur "/"
    if (request.nextUrl.pathname === '/') {
      const url = request.nextUrl.clone()
      url.pathname = plan ? '/dashboard' : '/onboarding/transition'
      const redirectResponse = NextResponse.redirect(url)
      supabaseResponse.cookies.getAll().forEach(c => redirectResponse.cookies.set(c.name, c.value, c))
      return redirectResponse
    }
    // C. 🛡️ HARDENED ACTIVITY TRACKING (10m Throttle)
    if (isDashboardPath) {
      const lastSeenSync = request.cookies.get('af_last_seen_sync')
      
      if (!lastSeenSync) {
        // We use dynamic imports for the admin client to keep the middleware light
        const { createAdminClient } = await import('../../lib/supabase/admin')
        const supabaseAdmin = createAdminClient()
        
        // Update tamper-proof app_metadata
        await supabaseAdmin.auth.admin.updateUserById(user.id, {
          app_metadata: { 
            last_seen_at: new Date().toISOString() 
          }
        })

        // Set the throttle cookie (10 minutes)
        supabaseResponse.cookies.set('af_last_seen_sync', 'true', {
          maxAge: 600, // 10 minutes
          path: '/',
          httpOnly: true,
          secure: process.env.NODE_ENV === 'production',
          sameSite: 'lax'
        })
      }
    }
  }

  return supabaseResponse
}
