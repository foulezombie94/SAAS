import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'

export async function POST(req: Request) {
  try {
    const { quoteId } = await req.json()
    
    // Use origin from headers or fallback to env for the redirect URL
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''
    
    if (!quoteId) {
      return NextResponse.json({ error: 'Quote ID is required' }, { status: 400 })
    }

    // We use the Admin client here because the client is public (unauthenticated)
    // The quoteId (UUID) acts as the secret token.
    const supabase = createAdminClient()

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('*, clients(name, email)')
      .eq('id', quoteId)
      .single()

    if (error || !quote) {
      console.error('Database error or quote not found:', error)
      return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
    }

    // Prevent paying for already paid or rejected quotes
    if (quote.status === 'paid') {
      return NextResponse.json({ error: 'Quote is already paid' }, { status: 400 })
    }

    const customerEmail = quote.clients?.email || undefined

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: `Réglage Devis #${quote.number}`,
              description: `ArtisanFlow - Prestation de services professionnelle`,
            },
            unit_amount: Math.round((quote.total_ttc || 0) * 100),
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      // Redirect back to the public shared page
      success_url: `${origin}/share/quotes/${quote.id}?payment=success`,
      cancel_url: `${origin}/share/quotes/${quote.id}?payment=canceled`,
      customer_email: customerEmail,
      metadata: {
        quoteId: quote.id,
      },
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Session Error:', err)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
