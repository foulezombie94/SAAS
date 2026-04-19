import { NextResponse, type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'
import { Redis } from '@upstash/redis'

// 🛡️ SECURITY CONFIG
const SECURITY_SECRET = process.env.SECURITY_SIGN_SECRET
const FINAL_SECRET = SECURITY_SECRET || 'artisan-flow-dev-fallback-7721'
const COOKIE_NAME = 'af_sec_rep'
const redis = Redis.fromEnv()
const encoder = new TextEncoder()

/**
 * 🔐 Validates HMAC signature using standard Web Crypto API (Edge Compatible)
 */
async function isValidSignature(data: string, signature: string): Promise<boolean> {
  try {
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(FINAL_SECRET),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify']
    )
    const sigArray = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    return await crypto.subtle.verify('HMAC', key, sigArray, encoder.encode(data))
  } catch {
    return false
  }
}

/**
 * 🚀 NEXT.JS 16 PROXY CONVENTION
 * Formerly middleware.ts
 */
export async function proxy(request: NextRequest) {
  const nonce = crypto.randomUUID()
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-nonce', nonce)

  // 1. Skip security for static assets
  const pathname = request.nextUrl.pathname
  if (
    pathname.includes('.') || 
    pathname.startsWith('/_next') || 
    pathname.startsWith('/api/csp-report')
  ) {
    return NextResponse.next({ request: { headers: requestHeaders } })
  }

  // 2. 🛡️ IP BAN CHECK (Redis)
  try {
    const ip = request.headers.get('x-real-ip') || 
               request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               '127.0.0.1'
    
    const isBanned = await redis.get(`ban:${ip}`)
    if (isBanned && !pathname.startsWith('/blocked')) {
      console.warn(`🚫 Blocking banned IP: ${ip}`)
      return NextResponse.redirect(new URL('/blocked', request.url))
    }
  } catch (e) {
    console.error('Redis check failed (Fail-Open):', e)
  }

  // 3. 🛡️ REPUTATION HMAC VALIDATION
  const reputationStr = request.cookies.get(COOKIE_NAME)?.value
  const signature = request.cookies.get(`${COOKIE_NAME}_sig`)?.value

  if (reputationStr && signature) {
    const isValid = await isValidSignature(reputationStr, signature)
    if (!isValid) {
      console.error('🚨 [REPUTATION] HMAC Mismatch! Tampering detected.')
      const response = NextResponse.redirect(new URL('/login', request.url))
      response.cookies.delete(COOKIE_NAME)
      response.cookies.delete(`${COOKIE_NAME}_sig`)
      return response
    }
  }

  // 4. SUPABASE SESSION & NONCE INJECTION
  const response = await updateSession(request, requestHeaders)

  // 5. SECURITY HEADERS (CSP)
  const isProd = process.env.NODE_ENV === 'production'
  const cspHeader = `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-eval' https:;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    font-src 'self' https://fonts.gstatic.com;
    img-src 'self' blob: data: https://*.stripe.com https://*.supabase.co https://lh3.googleusercontent.com https://res.cloudinary.com https://images.unsplash.com https://*.unsplash.com;
    frame-src 'self' https://js.stripe.com https://checkout.stripe.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stripe.com https://raw.githack.com https://raw.githubusercontent.com https://vitals.vercel-insights.com https://api.capsule.social;
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    ${isProd ? 'upgrade-insecure-requests;' : ''}
  `.replace(/\s{2,}/g, ' ').trim()

  response.headers.set('Content-Security-Policy', cspHeader)
  response.headers.set('x-nonce', nonce)
  response.headers.set('X-Frame-Options', 'DENY')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()')

  return response
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
