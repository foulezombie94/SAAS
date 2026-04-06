import { NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { revalidatePath } from 'next/cache'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'
import type Stripe from 'stripe'

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature') as string
  const supabase = createAdminClient()

  let event: Stripe.Event

  // 1. Validation de la signature
  try {
    if (!sig || !stripeWebhookSecret) {
      return NextResponse.json({ error: 'Missing signature or secret' }, { status: 400 })
    }
    event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret)
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[STRIPE WEBHOOK] Signature error: ${errorMessage}`)
    // On utilise l'admin client typé pour logger l'erreur via RLS bypass
    await supabase.from('webhook_logs').insert({
      event_type: 'signature_failed',
      error: errorMessage,
      payload: { sig_prefix: sig?.substring(0, 10) }
    })
    return NextResponse.json({ error: `Webhook Error: ${errorMessage}` }, { status: 400 })
  }


  try {
    switch (event.type) {
      // --- CYCLE DE VIE DE L'ABONNEMENT ---

      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        // SÉCURITÉ : userId et facture_id sont récupérés depuis les métadonnées Stripe
        // Ces métadonnées ont été injectées CÔTÉ SERVEUR lors de la création de la session
        // (voir src/app/api/billing/checkout/route.ts et src/app/api/payments/create-session/route.ts)
        const userId = session.client_reference_id || session.metadata?.userId
        const planType = session.metadata?.plan || (session.amount_total === 2200 ? 'monthly' : 'yearly')
        const factureId = session.metadata?.facture_id
        const quoteId = session.metadata?.quoteId || session.metadata?.devisId

        // Log de debug typé
        await supabase.from('webhook_logs').insert({
          event_type: 'checkout.session.completed',
          payload: { userId, session_id: session.id, planType, metadata: session.metadata } as any
        })

        // A. ACTIVATION PRO
        if (userId && (session.mode === 'subscription' || session.metadata?.plan)) {
          
          let subscriptionData = {}
          if (session.subscription) {
            const subscriptionId = typeof session.subscription === 'string' 
              ? session.subscription 
              : session.subscription.id;

            const subscription = await stripe.subscriptions.retrieve(subscriptionId)
            subscriptionData = {
              stripe_subscription_id: (subscription as any).id,
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            }
          }

          const { error: updateError } = await supabase
            .from('profiles')
            .update({ 
              is_pro: true, 
              plan: planType,
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString(),
              ...subscriptionData
            })
            .eq('id', userId)

          if (updateError) {
            console.error('[WEBHOOK] Profile update error:', updateError.message)
          } else {
            // 🚀 SENIOR OPTIMIZATION (GRADE 3): Sync 'plan' to JWT metadata (Zero-DB check)
            const { error: authError } = await supabase.auth.admin.updateUserById(userId, {
              app_metadata: { plan: planType }
            })

            if (authError) {
              console.error('[WEBHOOK] JWT Metadata sync error:', authError.message)
            }

            // 🚀 REVALIDATION INSTANTANÉE
            revalidatePath('/dashboard', 'layout')
          }
        }

        // B. LOGIQUE DEVIS / FACTURE (EXISTANTE)
        if (factureId || quoteId) {
          const connectedAccountId = (event as any).account
          let method = 'card' 
          const sessionWithExpansion = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['payment_intent.payment_method']
          }, {
            stripeAccount: connectedAccountId || undefined
          })
          
          const paymentIntent = sessionWithExpansion.payment_intent as any
          const methodType = paymentIntent?.payment_method?.type
          if (['sepa_debit', 'customer_balance', 'bank_transfer'].includes(methodType)) {
            method = 'virement'
          }

          if (factureId) {
            await supabase.from('invoices').update({ status: 'paid', stripe_session_id: session.id }).eq('id', factureId)
          }

          if (quoteId) {
            await supabase.from('quotes').update({ 
              status: 'paid', 
              payment_method: method,
              paid_at: new Date().toISOString(),
              payment_details: { stripe_session_id: session.id, payment_intent_id: session.payment_intent as string }
            }).eq('id', quoteId)
          }
        }
        break
      }

      case 'invoice.paid': {
        const invoice = event.data.object as any
        const subscriptionId = typeof invoice.subscription === 'string' 
          ? invoice.subscription 
          : invoice.subscription?.id;

        if (subscriptionId) {
          const subscription = await stripe.subscriptions.retrieve(subscriptionId)
          
          const { data: profile } = await supabase
            .from('profiles')
            .update({ 
              is_pro: true,
              current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
              updated_at: new Date().toISOString()
            })
            .eq('stripe_customer_id', invoice.customer as string)
            .select('id')
            .single()

          if (profile) {
            // 🚀 SENIOR OPTIMIZATION: Sync to JWT
            await supabase.auth.admin.updateUserById(profile.id, {
              app_metadata: { plan: 'pro' } // Simplified for recurring payments
            })
            revalidatePath('/dashboard', 'layout')
          }
        }
        break
      }
      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        
        const isCanceled = subscription.status === 'canceled' || subscription.status === 'unpaid'
        
        const { data: profile } = await supabase
          .from('profiles')
          .update({ 
            is_pro: !isCanceled,
            current_period_end: new Date((subscription as any).current_period_end * 1000).toISOString(),
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', subscription.customer as string)
          .select('id')
          .single()

        if (profile) {
          // 🚀 SENIOR OPTIMIZATION: Sync to JWT
          await supabase.auth.admin.updateUserById(profile.id, {
            app_metadata: { plan: isCanceled ? 'free' : 'pro' }
          })
          revalidatePath('/dashboard', 'layout')
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        
        // RETOUR AU PLAN FREE
        const { data: profile } = await supabase
          .from('profiles')
          .update({ 
            is_pro: false, 
            plan: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', subscription.customer as string)
          .select('id')
          .single()

        if (profile) {
          // 🚀 SENIOR OPTIMIZATION: Sync to JWT
          await supabase.auth.admin.updateUserById(profile.id, {
            app_metadata: { plan: 'free' }
          })
          revalidatePath('/dashboard', 'layout')
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        await supabase.from('webhook_logs').insert({
          event_type: 'invoice.payment_failed',
          payload: { customer: invoice.customer, invoice_id: invoice.id } as any
        })
        break
      }

      default:
    }

    return NextResponse.json({ received: true })
  } catch (err: unknown) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error'
    console.error(`[STRIPE WEBHOOK] Critical error: ${errorMessage}`)
    return NextResponse.json(
      { error: 'Webhook handler failed', details: errorMessage },
      { status: 500 }
    )
  }
}

export const dynamic = 'force-dynamic'
