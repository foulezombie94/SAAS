import Stripe from 'stripe'

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2024-04-10' as any,
  typescript: true,
})

export async function createCheckoutSession(invoiceId: string, quoteId: string, amount: number, customerEmail: string, invoiceNumber: string) {
  const session = await stripe.checkout.sessions.create({
    payment_method_types: ['card', 'link', 'sepa_debit'],
    line_items: [
      {
        price_data: {
          currency: 'eur',
          product_data: {
            name: `Réglage Facture #${invoiceNumber}`,
            description: 'ArtisanFlow - Facture Electronique',
          },
          unit_amount: Math.round(amount * 100), // Stripe expects cents
        },
        quantity: 1,
      },
    ],
    mode: 'payment',
    success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/quotes/${quoteId}?success=true`,
    cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/dashboard/quotes/${quoteId}?canceled=true`,
    customer_email: customerEmail,
    metadata: {
      facture_id: invoiceId,
      quoteId,
    },
  })

  return session.url
}
