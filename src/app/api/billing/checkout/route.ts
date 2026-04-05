import { NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { createClient } from '@/utils/supabase/server'

export async function POST(req: Request) {
  try {
    const { plan } = await req.json()
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()

    if (!user) {
      return NextResponse.json({ error: 'Non authentifié' }, { status: 401 })
    }

    // Origin for redirects
    const origin = req.headers.get('origin') || process.env.NEXT_PUBLIC_SITE_URL || ''

    // Map plan to specific Price IDs (configured in Stripe Dashboard)
    // IMPORTANT: Replace these with your real Price IDs
    const priceId = plan === 'yearly' 
      ? process.env.STRIPE_PRO_YEARLY_PRICE_ID // ex: price_123...
      : process.env.STRIPE_PRO_MONTHLY_PRICE_ID // ex: price_456...

    if (!priceId) {
      console.error('Missing Stripe Price ID for plan:', plan)
      return NextResponse.json({ error: `Configuration Stripe manquante pour le plan ${plan}` }, { status: 500 })
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card', 'link'],
      line_items: [{ price: priceId, quantity: 1 }],
      mode: 'subscription',
      success_url: `${origin}/dashboard?checkout=success`,
      cancel_url: `${origin}/#pricing`,
      ...(user.email ? { customer_email: user.email } : {}),
      client_reference_id: user.id,
      metadata: {
        type: 'pro_plan',
        userId: user.id,
        plan: plan, // 'monthly' or 'yearly'
      },
      // Optional: Allow promotion codes
      allow_promotion_codes: true,
      billing_address_collection: 'required',
    })

    return NextResponse.json({ url: session.url })
  } catch (err: any) {
    console.error('Stripe Billing Error:', err)
    return NextResponse.json({ error: err.message || 'Erreur lors de la création de la session de paiement' }, { status: 500 })
  }
}

