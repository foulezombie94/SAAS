'use server'

import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'
import { rateLimit } from '@/lib/rate-limit'

export async function acceptQuote(quoteId: string, signatureUrl: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  const { error } = await supabase
    .from('quotes')
    .update({ 
      status: 'accepted',
      signature_url: signatureUrl
    })
    .eq('id', quoteId)
    .eq('user_id', user.id) // DOUBLE BELT: Ensure user owns the quote

  if (error) throw error
  return { success: true }
}

export async function createPayment(quoteId: string, amount: number, email: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non autorisé')

  // 0. RATE LIMITING (5 requests per minute per user)
  const limit = rateLimit(`stripe-payment-${user.id}`, 5, 60000)
  if (!limit.success) throw new Error(limit.message)

  // 1. Verify Ownership before Stripe
  const { data: quote, error: fetchError } = await supabase
    .from('quotes')
    .select('user_id')
    .eq('id', quoteId)
    .single()

  if (fetchError || !quote || quote.user_id !== user.id) {
    throw new Error('Devis introuvable ou accès refusé')
  }

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [{
      price_data: {
        currency: 'eur',
        product_data: { name: `Devis #${quoteId}` },
        unit_amount: Math.round(amount * 100),
      },
      quantity: 1,
    }],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/quotes/${quoteId}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/quotes/${quoteId}?cancel=true`,
    customer_email: email,
    metadata: { quoteId, userId: user.id }
  })

  if (session.url) {
    redirect(session.url)
  }
}
