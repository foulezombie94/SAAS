import { NextResponse, type NextRequest } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { createAdminClient } from '@/utils/supabase/admin'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(req: Request) {
  const body = await req.text()
  const sig = (await headers()).get('stripe-signature') as string

  let event

  try {
    if (!sig || !webhookSecret) {
      console.error('Missing Stripe signature or webhook secret')
      return NextResponse.json({ error: 'Webhook Secret or Signature missing' }, { status: 400 })
    }
    event = stripe.webhooks.constructEvent(body, sig, webhookSecret)
  } catch (err: any) {
    console.error(`Webhook Signature verification failed: ${err.message}`)
    return NextResponse.json({ error: `Webhook Error: ${err.message}` }, { status: 400 })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object
        const quoteId = session.metadata?.quoteId
        console.log(`Webhook received for Quote ID: ${quoteId}`)

        if (!quoteId) {
          console.error('No quoteId found in session metadata')
          break
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

        // 2. Update quote status to 'paid' and store the method
        const { error: updateError } = await supabase
          .from('quotes')
          .update({ 
            status: 'paid',
            payment_method: method,
            payment_details: { 
               stripe_session_id: session.id,
               payment_intent_id: session.payment_intent as string,
               completed_at: new Date().toISOString()
            },
            updated_at: new Date().toISOString()
          })
          .eq('id', quoteId)
        
        console.log(`Update result for ${quoteId}:`, { error: updateError })

        if (updateError) {
          console.error('Failed to update quote status:', updateError)
          throw updateError
        }

        console.log(`Quote ${quoteId} successfully marked as PAID via ${method}`)
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
