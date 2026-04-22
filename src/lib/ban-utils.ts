import { redis } from '@/lib/rate-limit'
import { REDIS_KEYS } from '@/lib/redis-keys'

/**
 * Fetches the ban expiry timestamp (ms epoch) for a given email.
 * Follows a 3-level resolution chain:
 *   1. Redis cache (email → userId mapping)
 *   2. DB fallback for profile (if mapping expired)
 *   3. Auth admin user data (if ban key missing from Redis)
 *
 * @returns Epoch ms timestamp of ban expiry, or 0 if not banned.
 */
export async function getBanExpiry(email: string): Promise<number> {
  if (!redis || !email) return 0

  try {
    const normalizedEmail = email.trim().toLowerCase()

    // Step 1: Resolve userId from Redis cache
    let mappedUserId: string | null = null
    const cached = await redis.get(REDIS_KEYS.emailToUser(normalizedEmail))
    if (typeof cached === 'string' && cached.length > 0) {
      mappedUserId = cached
    }

    // Step 2: Fallback to DB if mapping expired
    if (!mappedUserId) {
      try {
        const { requireAdminClient } = await import('@/lib/supabase/admin')
        const adminSupabase = requireAdminClient()
        const { data: profile } = await adminSupabase
          .from('profiles')
          .select('id')
          .eq('email', normalizedEmail)
          .single()

        if (profile?.id) {
          mappedUserId = profile.id
          // Self-heal: repopulate cache
          await redis.set(REDIS_KEYS.emailToUser(normalizedEmail), mappedUserId, {
            ex: 7 * 24 * 60 * 60,
          })
        }
      } catch (e) {
        console.error('[BAN-UTILS] DB fallback failed:', e)
      }
    }

    if (!mappedUserId) return 0

    // Refresh mapping TTL on active login attempts
    await redis.expire(REDIS_KEYS.emailToUser(normalizedEmail), 7 * 24 * 60 * 60)

    // Step 3: Resolve ban timestamp from Redis
    const bannedUntilStr = await redis.get(REDIS_KEYS.userBan(mappedUserId))
    let timestamp = 0

    if (bannedUntilStr) {
      timestamp = Number(bannedUntilStr)
      // Handle legacy bans with non-timestamp values (e.g., "1", "true")
      if (!Number.isFinite(timestamp) || timestamp < 1_000_000_000_000) {
        const ttlSeconds = await redis.ttl(REDIS_KEYS.userBan(mappedUserId))
        timestamp = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0
      }
    } else {
      // Step 4: Fallback to Supabase auth.users if ban missing from Redis (webhook lag)
      try {
        const { requireAdminClient } = await import('@/lib/supabase/admin')
        const adminSupabase = requireAdminClient()
        const {
          data: { user: adminUser },
        } = await adminSupabase.auth.admin.getUserById(mappedUserId)

        if (adminUser?.banned_until) {
          timestamp = new Date(adminUser.banned_until).getTime()
          const banTtlSeconds = Math.ceil((timestamp - Date.now()) / 1000)
          if (banTtlSeconds > 0) {
            // Self-heal Redis
            await redis.set(REDIS_KEYS.userBan(mappedUserId), timestamp.toString(), {
              ex: banTtlSeconds,
            })
          }
        }
      } catch (e) {
        console.error('[BAN-UTILS] Admin user fallback failed:', e)
      }
    }

    return timestamp
  } catch (e) {
    console.error('[BAN-UTILS] Unexpected error:', e)
    return 0
  }
}

/**
 * Formats a ban expiry timestamp into a user-facing French message.
 */
export function formatBanMessage(timestamp: number): string {
  const TEN_YEARS_MS = 10 * 365 * 24 * 60 * 60 * 1000
  if (timestamp - Date.now() > TEN_YEARS_MS) {
    return 'Votre compte est définitivement banni.'
  }
  const date = new Date(timestamp)
  const datePart = date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  })
  const timePart = date.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  })
  return `Votre compte est temporairement suspendu. Fin de la suspension le ${datePart} à ${timePart}.`
}
