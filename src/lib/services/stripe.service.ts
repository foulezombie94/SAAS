export class StripeService {
  /**
   * Creates a Stripe Checkout session for a specific quote.
   */
  static async createCheckoutSession(quoteId: string) {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        quoteId,
        successUrl: `${window.location.origin}/dashboard/quotes/${quoteId}?success=true`,
        cancelUrl: `${window.location.origin}/dashboard/quotes/${quoteId}?canceled=true`
      })
    })

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erreur serveur Stripe (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) { /* ignore parse error */ }
      throw new Error(errorMessage);
    }

    const data = await response.json();
    if (!data.url) throw new Error('URL de paiement manquante');
    
    return data.url;
  }
}
