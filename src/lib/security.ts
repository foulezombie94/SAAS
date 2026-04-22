import { cookies, headers } from 'next/headers'
import { redis } from '@/lib/rate-limit'   // FIX #21: Use shared instance from rate-limit.ts
import { REDIS_KEYS } from '@/lib/redis-keys'

// FIX #1/#2: Throw in production if secret is missing — never use a hardcoded fallback
const SECURITY_SECRET = process.env.SECURITY_SIGN_SECRET

if (!SECURITY_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error(
    '🚨 FATAL: SECURITY_SIGN_SECRET environment variable is not set. Cannot start in production.'
  )
}

const FINAL_SECRET = SECURITY_SECRET || 'artisan-flow-dev-fallback-7721' // dev only

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

async function getCryptoKey() {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(FINAL_SECRET),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  )
}

async function getSafeIp(): Promise<string> {
  const h = await headers()
  return h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
}

async function signState(state: SecurityState): Promise<string> {
  const data = JSON.stringify(state)
  const key = await getCryptoKey()
  const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(data))
  const sigHex = Array.from(new Uint8Array(signature))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('')
  return `${btoa(data)}.${sigHex}`
}

async function verifyState(token: string): Promise<SecurityState | null> {
  try {
    const [dataB64, signature] = token.split('.')
    if (!dataB64 || !signature) return null
    const data = atob(dataB64)
    const key = await getCryptoKey()
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

export async function getSecurityReputation(): Promise<SecurityState> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  // 1. Check IP-based block — FIX #15: Use unified REDIS_KEYS
  const ip = await getSafeIp()
  const ipBlocked = redis ? await redis.get(REDIS_KEYS.ipBan(ip)) : null
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

export async function reportSecurityEvent(event: 'FAIL' | 'BOT') {
  const state = await getSecurityReputation()
  const cookieStore = await cookies()
  const ip = await getSafeIp()

  let newState: SecurityState = { ...state }
  const expiry = Date.now() + 72 * 60 * 60 * 1000 // 72 Hours

  // FIX: Only block on BOT events, never on FAIL alone
  if (event === 'BOT') {
    newState.status = 'BLOCKED'
    newState.expiry = expiry
    if (redis) {
      await redis.set(REDIS_KEYS.ipBan(ip), expiry, { px: 72 * 60 * 60 * 1000 })
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
    await redis.del(REDIS_KEYS.ipBan(ip))
  }
}
