import { Quote } from '@/types/dashboard'
import { generateQuoteTokenAction } from '@/app/dashboard/quotes/actions'

export interface SendEmailParams {
  quoteId: string
  to: string
  subject: string
  message: string
}

export class QuoteService {
  /**
   * Triggers the sending of a quote via email.
   */
  static async sendEmail(params: SendEmailParams) {
    const response = await fetch('/api/quotes/send-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })

    if (!response.ok) {
      const errorText = await response.text();
      let errorMessage = `Erreur lors de l'envoi (${response.status})`;
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorMessage;
      } catch (e) { /* ignore parse error */ }
      throw new Error(errorMessage);
    }

    return await response.json();
  }

  /**
   * Generates or retrieves the share link for a quote.
   */
  static async getShareLink(quote: Quote) {
    let token = quote.public_token;
    
    if (!token) {
      const result = await generateQuoteTokenAction(quote.id);
      if (result.success && result.token) {
        token = result.token;
      } else {
        throw new Error(result.error || 'Impossible de générer le jeton de partage');
      }
    }

    return {
      token,
      url: `${window.location.origin}/share/quotes/${quote.id}?token=${token}`
    };
  }

  /**
   * Triggers a server-side PDF generation and download.
   */
  static async downloadPdf(quoteId: string, quoteNumber: string) {
    const response = await fetch(`/api/quotes/pdf/${quoteId}`);
    
    if (!response.ok) {
      throw new Error(`Erreur lors de la génération du PDF (${response.status})`);
    }

    const blob = await response.blob();
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Devis_${quoteNumber}.pdf`;
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    document.body.removeChild(a);
  }
}
