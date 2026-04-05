'use server'

import { createClient } from '@/utils/supabase/server'
import { stripe } from '@/lib/stripe'
import { redirect } from 'next/navigation'

export async function acceptQuote(quoteId: string, signatureUrl: string) {
  const supabase = await createClient()
  
  const { error } = await supabase
    .from('quotes')
    .update({ 
      status: 'accepted',
      // We could store the signature in Supabase Storage or as a base64 field
      // For MVP, we'll just mark as accepted
    })
    .eq('id', quoteId)

  if (error) throw error
  return { success: true }
}

export async function createPayment(quoteId: string, amount: number, email: string) {
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
    metadata: { quoteId }
  })

  if (session.url) {
    redirect(session.url)
  }
}
