import { NextResponse } from 'next/server'
import { createAdminClient } from '@/utils/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

/**
 * 🛡️ SECURE PUBLIC QUOTE DATA ENDPOINT
 * 
 * Replaces dangerous anon RLS SELECT policies.
 * Uses Admin Client (service_role) to bypass RLS,
 * but validates the token before returning any data.
 * 
 * Returns ONLY the fields needed for public display
 * (no IBAN, SMTP, email, phone, etc.)
 */
export async function POST(req: Request) {
  try {
    const { quoteId, publicToken } = await req.json()

    // 1. Rate Limiting
    const ip = req.headers.get('x-real-ip') || req.headers.get('x-forwarded-for')?.split(',')[0] || 'anonymous'
    const limit = await rateLimit(`public-data-${ip}`, 10, 60000)
    if (!limit.success) {
      return NextResponse.json({ error: limit.message }, { status: 429 })
    }

    // 2. UUID Validation
    if (!quoteId || !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(quoteId)) {
      return NextResponse.json({ error: 'ID invalide' }, { status: 400 })
    }

    if (!publicToken || typeof publicToken !== 'string' || publicToken.length < 10) {
      return NextResponse.json({ error: 'Token invalide' }, { status: 400 })
    }

    // 3. Fetch via Admin Client (bypasses RLS) with token verification
    const supabase = createAdminClient()

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('id, number, status, total_ht, total_ttc, tax_rate, signature_url, artisan_signature_url, client_signature_url, payment_method, paid_at, created_at, updated_at, clients(name, address, city, email), profiles(company_name, address, siret, stripe_charges_enabled)')
      .eq('id', quoteId)
      .eq('public_token', publicToken)
      .single()

    if (error || !quote) {
      return NextResponse.json({ error: 'Devis introuvable ou token invalide' }, { status: 404 })
    }

    // 4. Fetch items separately
    const { data: items } = await supabase
      .from('quote_items')
      .select('id, description, quantity, unit_price, total_price')
      .eq('quote_id', quoteId)

    // 5. Find associated invoice if any
    const { data: invoice } = await supabase
      .from('invoices')
      .select('id')
      .eq('quote_id', quoteId)
      .single()

    return NextResponse.json({
      ...quote,
      quote_items: items || [],
      invoice_id: invoice?.id || null
    })

  } catch (err: any) {
    console.error('[API/Public Quote] Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
