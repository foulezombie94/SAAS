import { NextResponse } from 'next/server'
import { createAdminClient, requireAdminClient } from '@/lib/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'
import { revalidatePath, revalidateTag } from 'next/cache'

export async function POST(req: Request) {
  try {
    const { quoteId, publicToken } = await req.json()
    
    // 0. RATE LIMITING (Prevent spamming views)
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const limit = await rateLimit(`public-view-${ip}-${quoteId}`, 3, 60000) // Max 3 times per minute per quote
    if (!limit.success) {
      return NextResponse.json({ error: 'Too many view requests' }, { status: 429 })
    }

    // 1. VALIDATION UUID
    if (!quoteId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quoteId)) {
      return NextResponse.json({ error: 'ID de devis invalide' }, { status: 400 })
    }

    const adminSupabase = requireAdminClient()

    // 2. VERIFY TOKEN & UPDATE VIEWED_AT
    // We update only if the token matches to prevent unauthorized polling
    const { data, error } = await adminSupabase
      .from('quotes')
      .update({ last_viewed_at: new Date().toISOString() })
      .eq('id', quoteId)
      .eq('public_token', publicToken || '')
      .select('id, user_id')
      .single()

    if (error || !data) {
      return NextResponse.json({ error: 'Accès refusé ou lien expiré' }, { status: 403 })
    }

    // 🚀 Invalidation Cache (Next.js 16 nécessite désormais un profil)
    revalidateTag('all-quotes', 'default')
    revalidateTag('dashboard-stats', 'default')
    revalidatePath('/dashboard', 'layout')

    return NextResponse.json({ success: true })

  } catch (err: any) {
    if (err.message === 'SERVICE_UNAVAILABLE') {
      return NextResponse.json({ error: 'Service de validation momentanément indisponible.' }, { status: 503 })
    }
    console.error('Critical View Recording Failure:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
