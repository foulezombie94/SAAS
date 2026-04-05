import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'
import type Stripe from 'stripe'

const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature') as string

  let event

  try {
    if (!sig || !stripeWebhookSecret) {
      console.error('Missing Stripe signature or webhook secret')
      return NextResponse.json({ error: 'Webhook Secret or Signature missing' }, { status: 400 })
    }
    event = stripe.webhooks.constructEvent(body, sig, stripeWebhookSecret)
  } catch (err: any) {
    console.error(`Webhook Signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        console.log(`[STRIPE WEBHOOK] Event: ${event.type} | Mode: ${event.livemode ? 'LIVE' : 'TEST'}`)
        
        const factureId = session.metadata?.facture_id
        const quoteId = session.metadata?.quoteId
        const userId = session.client_reference_id

        console.log(`Webhook received - User: ${userId}, Facture: ${factureId}, Quote: ${quoteId}`)

        const supabase = createAdminClient()

        // 1. If it's a subscription or a specific PRO purchase
        if (userId && (session.mode === 'subscription' || session.metadata?.type === 'pro_plan')) {
          console.log(`Upgrading user ${userId} to PRO...`)
          
          await supabase
            .from('profiles')
            .update({ 
              is_pro: true, 
              plan: session.amount_total === 2200 ? 'monthly' : 'yearly',
              stripe_customer_id: session.customer as string,
              updated_at: new Date().toISOString()
            })
            .eq('id', userId)
          
          console.log(`User ${userId} is now PRO`)
        }

        // 2. Original Quote/Invoice Payment Logic
        if (factureId || quoteId) {
          // Identify the payment method type
          let method = 'card' 
          const sessionWithExpansion = await stripe.checkout.sessions.retrieve(session.id, {
            expand: ['payment_intent.payment_method']
          })
          
          const paymentIntent = sessionWithExpansion.payment_intent as any
          const methodType = paymentIntent?.payment_method?.type
          
          if (methodType === 'sepa_debit' || methodType === 'customer_balance' || methodType === 'bank_transfer') {
            method = 'virement'
          }

          if (factureId) {
            await supabase.from('invoices').update({ 
               status: 'paid',
               stripe_session_id: session.id,
               updated_at: new Date().toISOString()
            }).eq('id', factureId)
          }

          if (quoteId) {
            await supabase.from('quotes').update({ 
              status: 'paid',
              payment_method: method,
              payment_details: { 
                 stripe_session_id: session.id,
                 payment_intent_id: session.payment_intent as string,
                 completed_at: new Date().toISOString(),
                 facture_id: factureId || null
              },
              updated_at: new Date().toISOString()
            }).eq('id', quoteId)
          }
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const supabase = createAdminClient()
        
        console.log(`Subscription deleted for customer ${subscription.customer}`)
        
        await supabase
          .from('profiles')
          .update({ 
            is_pro: false, 
            plan: 'free',
            updated_at: new Date().toISOString()
          })
          .eq('stripe_customer_id', subscription.customer as string)
        
        break
      }

      default:
        console.log(`Unhandled event type ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (err: any) {
    console.error('Webhook processing error:', err)
    return NextResponse.json({ error: 'Webhook handler failed' }, { status: 500 })
  }
}

// Ensure the body is not parsed as JSON by default Next.js behavior if needed
// (Next.js 13+ App Router handles this automatically if using req.text())
export const dynamic = 'force-dynamic'
