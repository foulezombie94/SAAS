import { cookies } from 'next/headers'
import { createHash, createHmac } from 'crypto'

// Use a fallback secret if process.env.NEXTAUTH_SECRET or similar is missing
const SECURITY_SECRET = process.env.SUPABASE_SERVICE_ROLE_KEY || 'artisan-flow-local-security-secret-2024'

export type SecurityStatus = 'TRUSTED' | 'SUSPICIOUS' | 'BLOCKED'

interface SecurityState {
  status: SecurityStatus
  attempts: number
  lastAttempt: number
  expiry?: number
}

const COOKIE_NAME = 'af_sec_rep'

/**
 * Validates and signs a security state to prevent client-side tampering
 */
function signState(state: SecurityState): string {
  const data = JSON.stringify(state)
  const signature = createHmac('sha256', SECURITY_SECRET).update(data).digest('hex')
  return `${Buffer.from(data).toString('base64')}.${signature}`
}

/**
 * Verifies the signature of a received security cookie
 */
function verifyState(token: string): SecurityState | null {
  try {
    const [dataB64, signature] = token.split('.')
    if (!dataB64 || !signature) return null

    const data = Buffer.from(dataB64, 'base64').toString()
    const expectedSignature = createHmac('sha256', SECURITY_SECRET).update(data).digest('hex')

    if (signature !== expectedSignature) return null
    return JSON.parse(data) as SecurityState
  } catch {
    return null
  }
}

/**
 * Gets the current security reputation of the session
 */
export async function getSecurityReputation(): Promise<SecurityState> {
  const cookieStore = await cookies()
  const token = cookieStore.get(COOKIE_NAME)?.value

  if (token) {
    const state = verifyState(token)
    if (state) {
      // Check if BLOCKED expiry has passed
      if (state.status === 'BLOCKED' && state.expiry && Date.now() > state.expiry) {
        return { status: 'TRUSTED', attempts: 0, lastAttempt: Date.now() }
      }
      return state
    }
  }

  return { status: 'TRUSTED', attempts: 0, lastAttempt: Date.now() }
}

/**
 * Updates the security reputation based on events (failed login, bot detected)
 */
export async function reportSecurityEvent(event: 'FAIL' | 'BOT') {
  const state = await getSecurityReputation()
  const cookieStore = await cookies()

  let newState: SecurityState = { ...state }

  if (event === 'BOT') {
    newState.status = 'BLOCKED'
    newState.expiry = Date.now() + 72 * 60 * 60 * 1000 // 72 Hours
  } else if (event === 'FAIL') {
    newState.attempts++
    newState.lastAttempt = Date.now()

    if (newState.attempts >= 10) {
      newState.status = 'BLOCKED'
      newState.expiry = Date.now() + 72 * 60 * 60 * 1000
    } else if (newState.attempts >= 5) {
      newState.status = 'SUSPICIOUS'
    }
  }

  cookieStore.set(COOKIE_NAME, signState(newState), {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 72 * 60 * 60, // 3 days
  })

  return newState
}

/**
 * Resets reputation on successful login
 */
export async function resetSecurityReputation() {
  const cookieStore = await cookies()
  cookieStore.delete(COOKIE_NAME)
}
