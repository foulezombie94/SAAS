'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getStripeAccountStatus as getStatusAction } from '@/app/dashboard/profile/actions'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { rateLimit } from '@/lib/rate-limit'

export async function checkStripeConnection() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: { isReady: false }, error: null }

    const status = await getStatusAction()
    // Assume status has isReady boolean
    if (status && status.isReady) {
      return { data: { isReady: true }, error: null }
    }
    return { data: { isReady: false }, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Erreur de connexion Stripe' }
  }
}

export async function setFreePlan() {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { data: null, error: 'Utilisateur non identifié' }

    const { error } = await supabase
      .from('profiles')
      .update({ 
        plan: 'free',
        is_pro: false
      })
      .eq('id', user.id)

    if (error) return { data: null, error: error.message }
    
    // 🚀 SENIOR OPTIMIZATION: Sync to JWT (Fail-Soft Pattern)
    try {
      const { requireAdminClient } = await import('@/lib/supabase/admin')
      const adminClient = requireAdminClient()
      await adminClient.auth.admin.updateUserById(user.id, {
        app_metadata: { plan: 'free' }
      })
    } catch (e: any) {
      if (e.message === 'SERVICE_UNAVAILABLE') {
        console.warn('⚠️ [ONBOARDING] Service Admin indisponible. La mise à jour du plan JWT est ignorée.')
      } else {
        console.error('⚠️ [ONBOARDING] Erreur inattendue lors de la mise à jour JWT:', e.message)
      }
      // On continue : l'utilisateur est quand même créé dans la DB
    }

    // Revlaidation pour s'assurer que le tableau de bord affiche les bonnes informations.
    revalidatePath('/dashboard', 'layout')
    
    return { data: { success: true }, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Erreur lors de la mise à jour du plan' }
  }
}

export async function createSubscriptionSession(planType: 'monthly' | 'yearly') {
  try {
    const priceId = planType === 'monthly' 
      ? process.env.STRIPE_PRO_MONTHLY_PRICE_ID 
      : process.env.STRIPE_PRO_YEARLY_PRICE_ID

    if (!priceId) {
      return { data: null, error: 'Identifiant de prix non configuré sur le serveur' }
    }

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Utilisateur non identifié' }
    }

    // 0. RATE LIMITING (5 requests per minute per user)
    const limit = await rateLimit(`stripe-onboarding-${user.id}`, 5, 60000)
    if (!limit.success) {
      return { data: null, error: limit.message }
    }

    // 4. Sécurité des entrées (Zod)
    const planSchema = z.enum(['monthly', 'yearly'])
    const parsedResult = planSchema.safeParse(planType)
    if (!parsedResult.success) {
      return { data: null, error: 'Type de forfait invalide' }
    }

    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      client_reference_id: user.id,
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      mode: 'subscription',
      success_url: `${origin}/dashboard?onboarding=success`,
      cancel_url: `${origin}/onboarding/plans?canceled=true`,
      ...(user.email ? { customer_email: user.email } : {}),
      metadata: {
        userId: user.id,
        plan: planType 
      },
    })

    return { data: { url: session.url }, error: null }
  } catch (error: any) {
    console.error('Erreur Stripe Create Session:', error.message)
    return { data: null, error: error.message || 'Une erreur est survenue lors de l’initialisation du paiement Stripe.' }
  }
}

