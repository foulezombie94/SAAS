import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  // 1. Generate a cryptographically secure nonce for CSP (Direct UUID is safest for Edge)
  const nonce = crypto.randomUUID()

  // 2. Initialize request headers and inject the nonce
  // This allows the root layout to retrieve the nonce via headers().get('x-nonce')
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  // 3. SECURITY REPUTATION CHECK (Anti-Bypass: IP + Cookie)
  // 🛡️ Type fix: Access IP via headers first, then try the .ip property with cast
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0] || 
             request.headers.get('x-real-ip') || 
             (request as any).ip || 
             '127.0.0.1'
  const secToken = request.cookies.get('af_sec_rep')?.value
  
  // Allow the /blocked page itself and static assets to avoid loops
  if (!request.nextUrl.pathname.startsWith('/blocked') && !request.nextUrl.pathname.startsWith('/_next')) {
    try {
      // 🛡️ ARCHITECTURE FIX: Priority 1 - Centralized IP Block (Vercel Edge / Redis)
      const { Redis } = await import('@upstash/redis')
      const redis = Redis.fromEnv()
      const ipBlocked = await redis.get(`blocked:ip:${ip}`)
      
      if (ipBlocked) {
        return NextResponse.redirect(new URL('/blocked', request.url))
      }

      // 🛡️ Priority 2 - Session Cookie Reputation
      if (secToken) {
        const dataB64 = secToken.split('.')[0]
        if (dataB64) {
          const data = JSON.parse(atob(dataB64))
          if (data.status === 'BLOCKED' && (!data.expiry || Date.now() < data.expiry)) {
            return NextResponse.redirect(new URL('/blocked', request.url))
          }
        }
      }
    } catch (e) {
      // Ignore parsing/network errors for security check to avoid killing the site
    }
  }

  // 4. Special case for public share routes - skip auth but apply security
  if (request.nextUrl.pathname.startsWith('/share/')) {
    const response = NextResponse.next({
      request: {
        headers: requestHeaders,
      },
    })
    return applySecurityHeaders(response, nonce)
  }

  // 4. Update session (Auth logic)
  // Note: updateSession handles redirects for protected routes
  let response = await updateSession(request)
  
  // Merge the x-nonce header into the final response
  // and apply the Content-Security-Policy
  return applySecurityHeaders(response, nonce)
}

/**
 * 🛡️ SECURITY HEADER INJECTION
 * 
 * Applies the modernized, nonce-based CSP and other standard security headers.
 */
function applySecurityHeaders(response: NextResponse, nonce: string) {
  const isDev = process.env.NODE_ENV !== 'production'

  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}'${isDev ? " 'unsafe-eval'" : ""} https://js.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' blob: data: https://*.supabase.co https://*.stripe.com https://images.unsplash.com https://*.unsplash.com https://lh3.googleusercontent.com https://www.transparenttextures.com;
    font-src 'self' data: https://fonts.gstatic.com;
    media-src 'self' https://assets.mixkit.co;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://api.stripe.com https://*.stripe.com https://raw.githack.com https://*.githubusercontent.com;
    frame-src 'self' https://js.stripe.com https://checkout.stripe.com;
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isDev ? "" : "upgrade-insecure-requests;"}
    report-to csp-endpoint;
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)
  
  // 🛰️ Modern Reporting API (Required by report-to)
  response.headers.set(
    'Report-To',
    JSON.stringify({
      group: 'csp-endpoint',
      max_age: 10886400,
      endpoints: [{ url: '/api/csp-report' }],
    })
  )

  response.headers.set('x-nonce', nonce)
  
  // Re-confirm secondary security headers (Defense in Depth)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
