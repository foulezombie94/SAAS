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
    const isBanned = !!record.banned_until

    if (redis) {
      if (isBanned) {
        console.log(`[Webhook] Banning user ${userId} in Redis`)
        await redis.set(banKey, 'true')
        // Also clear the sync cookie by forcing a re-check if we had session logic here
        // But since it's a server-side Redis update, the next middleware check (within max 10m) will catch it.
      } else {
        // Silently ensure user is not banned in Redis
        await redis.del(banKey)
      }
    }

    return NextResponse.json({ success: true, action: isBanned ? 'ban' : 'unban' })
  } catch (error) {
    console.error('Webhook Error:', error)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
