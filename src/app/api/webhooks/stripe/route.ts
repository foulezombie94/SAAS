import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'

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
        const session = event.data.object as any
        console.log(`[STRIPE WEBHOOK] Event: ${event.type} | Mode: ${event.livemode ? 'LIVE' : 'TEST'}`)
        
        const factureId = session.metadata?.facture_id
        const quoteId = session.metadata?.quoteId

        console.log(`Webhook received - Facture: ${factureId}, Quote: ${quoteId}`)

        if (!factureId) {
          console.warn("Facture ID manquant dans la session metadata !");
          // Fallback to old system if quoteId exists but no factureId
          if (!quoteId) {
            console.error('No ID found in session metadata');
            break;
          }
        }

        const supabase = createAdminClient()

        // 1. Identify the payment method type
        // Checkout session might only show the types allowed, we need the specific one used.
        let method = 'card' // Default
        const sessionWithExpansion = await stripe.checkout.sessions.retrieve(session.id, {
           expand: ['payment_intent.payment_method']
        })
        
        const paymentIntent = sessionWithExpansion.payment_intent as any
        const methodType = paymentIntent?.payment_method?.type
        
        if (methodType === 'sepa_debit' || methodType === 'customer_balance' || methodType === 'bank_transfer') {
           method = 'virement'
        }

        // 2. Update status in Database
        // We update the invoice (if any) and the quote
        
        if (factureId) {
          const { error: invError } = await supabase
            .from('invoices')
            .update({ 
               status: 'paid',
               stripe_session_id: session.id,
               updated_at: new Date().toISOString()
            })
            .eq('id', factureId)
          
          if (invError) {
             console.error(`Failed to update invoice ${factureId}:`, invError)
          } else {
             console.log(`Invoice ${factureId} marked as PAID`)
          }
        }

        if (quoteId) {
          const { error: quoteError } = await supabase
            .from('quotes')
            .update({ 
              status: 'paid',
              payment_method: method,
              payment_details: { 
                 stripe_session_id: session.id,
                 payment_intent_id: session.payment_intent as string,
                 completed_at: new Date().toISOString(),
                 facture_id: factureId || null
              },
              updated_at: new Date().toISOString()
            })
            .eq('id', quoteId)
          
          if (quoteError) {
            console.error(`Failed to update quote ${quoteId}:`, quoteError)
          } else {
            console.log(`Quote ${quoteId} marked as PAID`)
          }
        }
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
