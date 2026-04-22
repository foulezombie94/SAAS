import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/rate-limit'
import { REDIS_KEYS } from '@/lib/redis-keys'
import crypto from 'crypto'

/**
 * Webhook specific for Supabase Auth synchronized with Upstash Redis.
 * This route allows for instant ban/unban synchronization.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-supabase-webhook-secret')
    const secret = process.env.SUPABASE_WEBHOOK_SECRET

    // FIX #4: Timing-safe comparison to prevent timing attacks
    const isAuthorized =
      secret &&
      authHeader &&
      authHeader.length === secret.length &&
      crypto.timingSafeEqual(Buffer.from(authHeader), Buffer.from(secret))

    if (!isAuthorized) {
      console.error('Unauthorized Webhook Attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()

    const { record, old_record } = payload

    if (!record || !record.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const userId = record.id
    const banKey = REDIS_KEYS.userBan(userId)

    let isBanned = false
    let bannedUntilTime = 0

    if (record.banned_until) {
      const bannedUntilDate = new Date(record.banned_until)
      bannedUntilTime = bannedUntilDate.getTime()
      if (bannedUntilTime > Date.now()) {
        isBanned = true
      }
    }

    if (redis) {
      const normalizedEmail = record.email?.trim().toLowerCase()
      const oldNormalizedEmail = old_record?.email?.trim().toLowerCase()
      const pipeline = redis.pipeline()
      const isDev = process.env.NODE_ENV !== 'production'

      // Handle email change: clean up old mapping
      if (oldNormalizedEmail && oldNormalizedEmail !== normalizedEmail) {
        if (isDev) console.log(`[Webhook] Email changed. Deleting old mapping for ${oldNormalizedEmail}`)
        pipeline.del(REDIS_KEYS.emailToUser(oldNormalizedEmail))
      }

      if (isBanned) {
        const banTtlSeconds = Math.ceil((bannedUntilTime - Date.now()) / 1000)
        if (banTtlSeconds > 1) {
          if (isDev) console.log(`[Webhook] Banning user ${userId} for ${banTtlSeconds}s`)
          pipeline.set(banKey, bannedUntilTime.toString(), { ex: banTtlSeconds })
        }
      } else {
        if (isDev) console.log(`[Webhook] Unbanning user ${userId}`)
        pipeline.del(banKey)
      }

      if (normalizedEmail) {
        const ttlSeconds = 7 * 24 * 60 * 60
        pipeline.set(REDIS_KEYS.emailToUser(normalizedEmail), userId, { ex: ttlSeconds })
      }

      try {
        const results = await pipeline.exec()
        if (!results) throw new Error('Redis pipeline returned null')
      } catch (err) {
        console.error('[Webhook] Redis pipeline failed:', err)
      }
    }

    return NextResponse.json({ success: true, action: isBanned ? 'ban' : 'unban' })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
