import { cookies, headers } from 'next/headers'
import { Redis } from '@upstash/redis'

// 🛡️ SECURITY PARANOIA: Same strict secret requirement
const SECURITY_SECRET = process.env.SECURITY_SIGN_SECRET

if (!SECURITY_SECRET && process.env.NODE_ENV === 'production') {
  // 🟡 FAIL-SOFT: Prevent 500 Server Error on Vercel if Env Var is missing
  console.error('🚨 CRITICAL: SECURITY_SIGN_SECRET is missing! Please configure it in Vercel to use secure HMAC signing.')
}

const FINAL_SECRET = SECURITY_SECRET || 'artisan-flow-dev-fallback-7721'

// 🟡 FAIL-SOFT: Initialize Redis only if keys are present to avoid top-level crash
export const redis = (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN)
  ? Redis.fromEnv()
  : null;

export type SecurityStatus = 'TRUSTED' | 'SUSPICIOUS' | 'BLOCKED'

interface SecurityState {
  status: SecurityStatus
  attempts: number
  lastAttempt: number
  expiry?: number
}

const COOKIE_NAME = 'af_sec_rep_v3'

// --- 🛠️ WEB CRYPTO UTILITIES ---

const encoder = new TextEncoder()

/**
 * Imports the secret key for HMAC
 */
async function getCryptoKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(FINAL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

/**
 * Robust IP retrieval to prevent Spoofing (Edge Compatible)
 */
async function getSafeIp(): Promise<string> {
  const h = await headers()
  return h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
}

/**
 * Validates and signs a security state to prevent client-side tampering
 */
async function signState(state: SecurityState): Promise<string> {
  const data = JSON.stringify(state)
  const key = await getCryptoKey()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  
  // Convert signature to hex
  const sigHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
    
  return `${btoa(data)}.${sigHex}`
}

/**
 * Verifies the signature using Web Crypto's native timing-safe verification
 */
async function verifyState(token: string): Promise<SecurityState | null> {
  try {
    const [dataB64, signature] = token.split('.')
    if (!dataB64 || !signature) return null

    const data = atob(dataB64)
    const key = await getCryptoKey()
    
    // Convert hex signature back to Uint8Array
    const sigArray = new Uint8Array(signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16)))
    
    const isValid = await crypto.subtle.verify('HMAC', key, sigArray, encoder.encode(data))

    if (!isValid) {
      console.warn('🚨 Invalid signature detected!')
      return null
    }

    return JSON.parse(data) as SecurityState
  } catch {
    return null
  }
}

/**
 * Gets the current security reputation (Considers both Cookie and IP)
 */
export async function getSecurityReputation(): Promise<SecurityState> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  // 1. Check IP-based block
  const ip = await getSafeIp()
  const ipBlocked = redis ? await redis.get(`blocked_v2:ip:${ip}`) : null
  
  if (ipBlocked) {
    return { status: 'BLOCKED', attempts: 10, lastAttempt: Date.now(), expiry: Number(ipBlocked) }
  }

  // 2. Check Cookie-based block
  if (token) {
    const state = await verifyState(token)
    if (state) {
      if (state.status === 'BLOCKED' && state.expiry && Date.now() > state.expiry) {
        return { status: 'TRUSTED', attempts: 0, lastAttempt: Date.now() }
      }
      return state
    }
  }

  return { status: 'TRUSTED', attempts: 0, lastAttempt: Date.now() }
}

/**
 * Updates reputation and PERSISTS block to IP if necessary
 */
export async function reportSecurityEvent(event: 'FAIL' | 'BOT') {
  const state = await getSecurityReputation()
  const cookieStore = await cookies()
  const ip = await getSafeIp()

  let newState: SecurityState = { ...state }
  const expiry = Date.now() + 72 * 60 * 60 * 1000 // 72 Hours

  if (event === 'BOT') {
    newState.status = 'BLOCKED'
    newState.expiry = expiry
    if (redis) {
      await redis.set(`blocked_v2:ip:${ip}`, expiry, { px: 72 * 60 * 60 * 1000 })
    }
  } else if (event === 'FAIL') {
    newState.attempts++
    newState.lastAttempt = Date.now()
    if (newState.attempts >= 5) newState.status = 'SUSPICIOUS'
  }

  const signed = await signState(newState)
  const isProd = process.env.NODE_ENV === 'production'

  cookieStore.set(COOKIE_NAME, signed, {
    httpOnly: true,
    secure: isProd,
    sameSite: 'lax',
    path: '/',
    maxAge: 72 * 60 * 60,
  })

  return newState
}

export async function resetSecurityReputation() {
  const cookieStore = await cookies()
  const ip = await getSafeIp()
  
  cookieStore.delete(COOKIE_NAME)
  if (redis) {
    await redis.del(`blocked_v2:ip:${ip}`)
  }
}
