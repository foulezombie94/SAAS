import { cookies, headers } from 'next/headers'
import { createHmac, timingSafeEqual } from 'crypto'
import { Redis } from '@upstash/redis'

// 🛡️ SECURITY PARANOIA: Prevent execution in production without a dedicated secret.
// Using a fallback only in development.
const SECURITY_SECRET = process.env.SECURITY_SIGN_SECRET

if (!SECURITY_SECRET && process.env.NODE_ENV === 'production') {
  throw new Error('🚨 CRITICAL: SECURITY_SIGN_SECRET is missing! Production deployment halted for safety.')
}

const FINAL_SECRET = SECURITY_SECRET || 'artisan-flow-dev-fallback-7721'

const redis = Redis.fromEnv()

export type SecurityStatus = 'TRUSTED' | 'SUSPICIOUS' | 'BLOCKED'

interface SecurityState {
  status: SecurityStatus
  attempts: number
  lastAttempt: number
  expiry?: number
}

const COOKIE_NAME = 'af_sec_rep'

/**
 * Robust IP retrieval to prevent Spoofing
 * 🛡️ Priority 1: x-real-ip (Injected by Vercel/Trusted Proxies)
 * 🛡️ Priority 2: x-forwarded-for (Only the first entry)
 */
async function getSafeIp(): Promise<string> {
  const h = await headers()
  return h.get('x-real-ip') || h.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1'
}

/**
 * Validates and signs a security state to prevent client-side tampering
 */
function signState(state: SecurityState): string {
  const data = JSON.stringify(state)
  const hmac = createHmac('sha256', FINAL_SECRET)
  const signature = hmac.update(data).digest('hex')
  return `${Buffer.from(data).toString('base64')}.${signature}`
}

/**
 * Verifies the signature using timingSafeEqual to prevent Timing Attacks
 */
function verifyState(token: string): SecurityState | null {
  try {
    const [dataB64, signature] = token.split('.')
    if (!dataB64 || !signature) return null

    const data = Buffer.from(dataB64, 'base64').toString()
    const hmac = createHmac('sha256', FINAL_SECRET)
    const expectedSignature = hmac.update(data).digest('hex')

    // 🛡️ SECURITY FIX: Timing-safe comparison
    const sigBuf = Buffer.from(signature, 'hex')
    const expBuf = Buffer.from(expectedSignature, 'hex')

    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
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

  // 1. Check IP-based block (Anti-Bypass + Anti-Spoofing)
  const ip = await getSafeIp()
  const ipBlocked = await redis.get(`blocked:ip:${ip}`)
  
  if (ipBlocked) {
    return { status: 'BLOCKED', attempts: 10, lastAttempt: Date.now(), expiry: Number(ipBlocked) }
  }

  // 2. Check Cookie-based block
  if (token) {
    const state = verifyState(token)
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
 * Updates reputation and PERSISTS block to IP if necessary (Anti-Bypass)
 */
export async function reportSecurityEvent(event: 'FAIL' | 'BOT') {
  const state = await getSecurityReputation()
  const cookieStore = await cookies()
  const ip = await getSafeIp()

  let newState: SecurityState = { ...state }
  const expiry = Date.now() + 72 * 60 * 60 * 1000 // 72 Hours

  if (event === 'BOT' || (event === 'FAIL' && newState.attempts >= 9)) {
    newState.status = 'BLOCKED'
    newState.expiry = expiry
    // 🛡️ ARCHITECTURE FIX: Persist block to IP in Redis to prevent cookie clearing bypass
    await redis.set(`blocked:ip:${ip}`, expiry, { px: 72 * 60 * 60 * 1000 })
  } else if (event === 'FAIL') {
    newState.attempts++
    newState.lastAttempt = Date.now()
    if (newState.attempts >= 5) newState.status = 'SUSPICIOUS'
  }

  cookieStore.set(COOKIE_NAME, signState(newState), {
    httpOnly: true,
    secure: true,
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
  await redis.del(`blocked:ip:${ip}`)
}
