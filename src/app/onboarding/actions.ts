'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getStripeAccountStatus as getStatusAction } from '@/app/dashboard/settings/actions'
import { stripe } from '@/lib/stripe'

export async function checkStripeConnection() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { isReady: false }

  const status = await getStatusAction()
  if (status.isReady) {
    return { isReady: true }
  }
  return { isReady: false }
}

export async function setFreePlan() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilisateur non identifié')

  const { error } = await supabase
    .from('profiles')
    .update({ 
      plan: 'free',
      is_pro: false
    })
    .eq('id', user.id)

  if (error) throw error
  
  return { success: true }
}

export async function createSubscriptionSession(priceId: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilisateur non identifié')

  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card'],
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    mode: 'subscription',
    success_url: `${origin}/dashboard?onboarding=success`,
    cancel_url: `${origin}/onboarding/plans?canceled=true`,
    customer_email: user.email,
    metadata: {
      userId: user.id,
    },
  })

  return { url: session.url }
}
