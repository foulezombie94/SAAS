'use server'

import { createClient } from '@/utils/supabase/server'
import { redirect } from 'next/navigation'
import { getStripeAccountStatus as getStatusAction } from '@/app/dashboard/settings/actions'
import { stripe } from '@/lib/stripe'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

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
    
    // Revlaidation pour s'assurer que le tableau de bord affiche les bonnes informations.
    revalidatePath('/dashboard', 'layout')
    
    return { data: { success: true }, error: null }
  } catch (err: any) {
    return { data: null, error: err.message || 'Erreur lors de la mise à jour du plan' }
  }
}

export async function createSubscriptionSession(priceId: string) {
  try {
    // 1. Mapping objet de configuration (adieu les magics strings)
    const STRIPE_PLANS: Record<string, string> = {
      [process.env.STRIPE_PRO_MONTHLY_PRICE_ID || '']: 'monthly',
      [process.env.STRIPE_PRO_YEARLY_PRICE_ID || '']: 'yearly'
    }

    // 4. Sécurité des entrées (Zod) pour protéger l'injection d'IDs arbitraires
    const priceIdSchema = z.string().superRefine((val, ctx) => {
      if (!val || !(val in STRIPE_PLANS)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Identifiant de prix Stripe invalide ou non supporté.",
        });
      }
    });

    const parsedResult = priceIdSchema.safeParse(priceId);
    if (!parsedResult.success) {
      return { data: null, error: parsedResult.error.errors[0]?.message };
    }

    const planType = STRIPE_PLANS[priceId]; // 'monthly' | 'yearly'

    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) {
      return { data: null, error: 'Utilisateur non identifié' }
    }

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
      ...(user.email ? { customer_email: user.email } : {}),
      metadata: {
        userId: user.id,
        plan: planType 
      },
    })

    return { data: { url: session.url }, error: null }
  } catch (error: any) {
    console.error('Erreur Stripe Create Session:', error)
    return { data: null, error: error.message || 'Une erreur est survenue lors de l’initialisation du paiement Stripe.' }
  }
}

