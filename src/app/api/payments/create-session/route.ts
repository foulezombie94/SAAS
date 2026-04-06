import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

export async function POST(req: Request) {
  try {
    const { invoiceId } = await req.json()
    
    // Use origin from headers or fallback to env for the redirect URL
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''
    
    if (!invoiceId) {
      return NextResponse.json({ error: 'Invoice ID is required' }, { status: 400 })
    }

    // 0. RATE LIMITING (5 requests per minute per IP)
    const ip = req.headers.get('x-forwarded-for') || 'anonymous'
    const limit = await rateLimit(`public-payment-${ip}`, 5, 60000)
    if (!limit.success) {
      return NextResponse.json({ error: limit.message }, { status: 429 })
    }

    // We use the Admin client here because the client is public (unauthenticated)
    // The invoiceId (UUID) acts as the secret token.
    const supabase = createAdminClient()

    const { data: invoice, error } = await supabase
      .from('invoices')
      .select('*, clients(name, email), profiles(stripe_account_id)')
      .eq('id', invoiceId)
      .single()

    if (error || !invoice) {
      console.error('Invoice search error:', error?.message)
      return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
    }

    // Prevent paying for already paid invoices
    if (invoice.status === 'paid') {
      return NextResponse.json({ error: 'Invoice is already paid' }, { status: 400 })
    }

    const customerEmail = invoice.clients?.email || undefined
    const stripeAccountId = (invoice as any).profiles?.stripe_account_id
    
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réglage Facture #${invoice.number}`,
              description: `ArtisanFlow - Prestation de services professionnelle`,
            },
            unit_amount: Math.round((invoice.total_ttc || 0) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Redirect back to the public shared page (where the quote is shown)
      // Since invoice is linked to quote, we redirect back to quote page for consistent UX
      success_url: `${origin}/share/quotes/${invoice.quote_id}?payment=success`,
      cancel_url: `${origin}/share/quotes/${invoice.quote_id}?payment=canceled`,
      customer_email: customerEmail,
      metadata: {
        facture_id: invoice.id,
        quoteId: invoice.quote_id || '',
        devisId: invoice.quote_id || '',
      },
      payment_intent_data: stripeAccountId ? {
        application_fee_amount: 0,
        transfer_data: {
          destination: stripeAccountId,
        },
      } : undefined,
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Session Error:', err?.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
