import { NextResponse } from 'next/server'
import { z } from 'zod'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'
import { rateLimit } from '@/lib/rate-limit'

const CreateSessionSchema = z.object({
  invoiceId: z.string().uuid().optional(),
  quoteId: z.string().uuid().optional(),
}).refine(data => data.invoiceId || data.quoteId, {
  message: "ID de facture ou de devis requis"
})

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const result = CreateSessionSchema.safeParse(body)
    
    if (!result.success) {
      return NextResponse.json({ error: result.error.issues[0].message }, { status: 400 })
    }

    const { invoiceId, quoteId } = result.data
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    const ip = req.headers.get('x-forwarded-for') || 'anonymous'
    const limit = await rateLimit(`public-payment-${ip}`, 10, 60000)
    if (!limit.success) {
      return NextResponse.json({ error: limit.message }, { status: 429 })
    }

    const supabase = createAdminClient()
    let paymentData: {
      amount: number,
      name: string,
      email?: string,
      stripeAccountId?: string,
      metadata: Record<string, string>
      successUrl: string,
      cancelUrl: string
    }

    if (invoiceId) {
      const { data: invoice, error } = await supabase
        .from('invoices')
        .select('*, clients(name, email), profiles(stripe_account_id)')
        .eq('id', invoiceId)
        .single()

      if (error || !invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 })
      if (invoice.status === 'paid') return NextResponse.json({ error: 'Invoice already paid' }, { status: 400 })

      paymentData = {
        amount: Math.round((invoice.total_ttc || 0) * 100),
        name: `Facture #${invoice.number}`,
        email: invoice.clients?.email || undefined,
        stripeAccountId: (invoice as any).profiles?.stripe_account_id,
        metadata: {
          facture_id: invoice.id,
          quoteId: invoice.quote_id || '',
        },
        successUrl: `${origin}/share/quotes/${invoice.quote_id}?payment=success`,
        cancelUrl: `${origin}/share/quotes/${invoice.quote_id}?payment=canceled`,
      }
    } else {
      const { data: quote, error } = await supabase
        .from('quotes')
        .select('*, clients(name, email), profiles(stripe_account_id)')
        .eq('id', quoteId!)
        .single()

      if (error || !quote) return NextResponse.json({ error: 'Quote not found' }, { status: 404 })
      if (quote.status === 'paid') return NextResponse.json({ error: 'Quote already paid' }, { status: 400 })

      paymentData = {
        amount: Math.round((quote.total_ttc || 0) * 100),
        name: `Devis #${quote.number}`,
        email: quote.clients?.email || undefined,
        stripeAccountId: (quote as any).profiles?.stripe_account_id,
        metadata: {
          quoteId: quote.id,
          devisId: quote.id,
        },
        successUrl: `${origin}/share/quotes/${quote.id}?payment=success`,
        cancelUrl: `${origin}/share/quotes/${quote.id}?payment=canceled`,
      }
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link', 'sepa_debit'],
      line_items: [
        {
          price_data: {
            currency: 'eur',
            product_data: {
              name: paymentData.name,
              description: `ArtisanFlow - Prestation professionnelle`,
            },
            unit_amount: paymentData.amount,
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: paymentData.successUrl,
      cancel_url: paymentData.cancelUrl,
      customer_email: paymentData.email,
      metadata: paymentData.metadata,
    }, {
      stripeAccount: paymentData.stripeAccountId || undefined
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Session Error:', err?.message)
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 })
  }
}
