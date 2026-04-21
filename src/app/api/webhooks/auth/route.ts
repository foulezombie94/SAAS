import { NextRequest, NextResponse } from 'next/server'
import { redis } from '@/lib/rate-limit'

/**
 * Webhook specific for Supabase Auth synchronized with Upstash Redis.
 * This route allows for instant ban/unban synchronization.
 */
export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('x-supabase-webhook-secret')
    const secret = process.env.SUPABASE_WEBHOOK_SECRET

    // 1. Security Check
    if (!secret || authHeader !== secret) {
      console.error('Unauthorized Webhook Attempt')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const payload = await req.json()
    
    // Supabase DB Webhooks payload structure: { type, table, schema, record, old_record }
    const { type, record, old_record } = payload

    if (!record || !record.id) {
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    const userId = record.id
    const banKey = `artisan-flow:ban:${userId}`

    // 2. Logic: Handle Update or Insert (specifically looking for banned_until)
    // In Supabase, if a user is banned, the 'banned_until' field is populated.
    let isBanned = false;
    let bannedUntilTime = 0;

    if (record.banned_until) {
      const bannedUntilDate = new Date(record.banned_until);
      bannedUntilTime = bannedUntilDate.getTime();
      if (bannedUntilTime > Date.now()) {
        isBanned = true;
      }
    }

    if (redis) {
      const normalizedEmail = record.email?.trim().toLowerCase()
      const pipeline = redis.pipeline()

      if (isBanned) {
        const ttl = bannedUntilTime - Date.now()
        if (ttl > 0) {
          console.log(`[Webhook] Banning user ${userId} in Redis for ${Math.round(ttl / 1000)}s`)
          pipeline.set(banKey, bannedUntilTime.toString(), { px: ttl })
          if (normalizedEmail) {
            // Mapping email -> userId for a single source of truth for ban expiration
            pipeline.set(`artisan-flow:email-to-user:${normalizedEmail}`, userId, { px: ttl })
          }
        }
      } else {
        console.log(`[Webhook] Unbanning user ${userId} in Redis`)
        pipeline.del(banKey)
        if (normalizedEmail) {
          pipeline.del(`artisan-flow:email-to-user:${normalizedEmail}`)
        }
      }
      
      try {
        await pipeline.exec()
      } catch (err) {
        console.error('[Webhook] Failed to execute Redis pipeline:', err)
      }
    }

    return NextResponse.json({ success: true, action: isBanned ? 'ban' : 'unban' })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
