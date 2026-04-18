'use server'

import { createClient } from '@/utils/supabase/server'
import { QuoteInsertSchema, QuoteAcceptSchema, QuoteEmailSchema } from '@/lib/validations/quote'
import { getUsageLimits } from '@/app/dashboard/actions'
import { revalidateTag, revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/utils/supabase/admin'
import { revalidateDashboardCache, revalidateDocumentCache } from '@/utils/supabase/revalidate'

export async function createQuoteAction(rawData: unknown) {
  // 1. Validation Zod stricte : si ça échoue, ça lève une erreur qu'on attrape
  const parsed = QuoteInsertSchema.safeParse(rawData);
  
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation échouée' };
  }

  const data = parsed.data;

  try {
    const supabase = await createClient()
    
    const [authRes, limitStatus] = await Promise.all([
      supabase.auth.getUser(),
      getUsageLimits('quotes')
    ])

    const { data: { user } } = authRes
    if (!user) {
      return { success: false, error: 'Utilisateur non connecté' }
    }

    if (!limitStatus.allowed) {
      return { success: false, error: "Limite atteinte. Passez en PRO pour continuer !" }
    }

    const { data: quote, error: rpcError } = await supabase.rpc('create_quote_with_items_v3', {
      p_client_id: data.client_id,
      p_status: data.status,
      p_total_ht: data.total_ht,
      p_tax_rate: data.tax_rate,
      p_total_ttc: data.total_ttc,
      p_items: data.items as any,
      p_payment_details: (data.payment_details || undefined) as any,
      p_payment_method: data.payment_method || undefined,
      p_valid_until: data.valid_until || undefined,
      p_estimated_start_date: data.estimated_start_date || undefined,
      p_estimated_duration: data.estimated_duration || undefined
    });

    if (rpcError) {
      console.error('[createQuoteAction] RPC Error:', rpcError);
      throw new Error(rpcError.message)
    }

    // 🛡️ Neutralization: ensure no public_token or expiration exists by default
    // We force both to NULL so it can only be generated on-demand later
    if (quote) {
      await supabase
        .from('quotes')
        .update({ 
          public_token: null,
          public_token_expires_at: null
        } as any)
        .eq('id', quote as string);
    }
    
    
    // 🚀 Cache Invalidation (Global Tag-based - SaaS High-Scale)
    await revalidateDashboardCache()
    await revalidateDocumentCache()
    
    // Path-based for UI consistency
    revalidatePath('/dashboard', 'layout')

    return { success: true, quote }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la création atomique du devis' }
  }
}

export async function acceptQuoteAction(rawData: unknown) {
  const parsed = QuoteAcceptSchema.safeParse(rawData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  const { quoteId, signatureDataUrl, signerType } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  // 1. Rate Limit
  const limit = await rateLimit(`accept-${user.id}`, 3, 60000);
  if (!limit.success) return { success: false, error: limit.message };

  try {
    const adminSupabase = createAdminClient();
    
    // Extract MIME type
    const mimeMatch = signatureDataUrl.match(/^data:(image\/[a-zA-Z+]+);base64,/)
    const mimeType = mimeMatch ? mimeMatch[1] : 'image/png'
    const ext = mimeType.split('/')[1]?.replace('jpeg', 'jpg') || 'png'
    
    const base64Data = signatureDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `sig_${signerType}_${quoteId}_${Date.now()}.${ext}`;

    const { error: uploadError } = await adminSupabase.storage
      .from('signatures')
      .upload(fileName, buffer, { contentType: mimeType, upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = adminSupabase.storage
      .from('signatures')
      .getPublicUrl(fileName);

    const { data: resultData, error: rpcError } = await supabase.rpc('accept_quote_v4', {
      p_quote_id: quoteId,
      p_public_token: '', // Use empty string instead of null
      p_signature_url: publicUrl,
      p_signer_type: signerType
    });

    if (rpcError) throw rpcError;

    // 🚀 ZERO EXTRA QUERIES: The RPC now returns everything we need in one round-trip.
    const result = resultData as { 
      status: string; 
      artisan_signature_url: string; 
      client_signature_url: string; 
      invoice_id?: string;
    };

    await revalidateDocumentCache()
    revalidatePath(`/dashboard/quotes/${quoteId}`);

    return { 
      success: true, 
      signatureUrl: publicUrl,
      status: result.status,
      artisanSignatureUrl: result.artisan_signature_url,
      clientSignatureUrl: result.client_signature_url,
      invoiceId: result.invoice_id
    };
  } catch (err: any) {
    console.error('[acceptQuoteAction] Critical Failure:', err);
    return { success: false, error: err.message };
  }
}

export async function sendQuoteEmailAction(rawData: unknown) {
  const parsed = QuoteEmailSchema.safeParse(rawData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  const { quoteId, subject, message, to } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  const limit = await rateLimit(`email-${user.id}`, 5, 60000);
  if (!limit.success) return { success: false, error: limit.message };

  try {
    // 🕵️‍♂️ On réutilise la logique de l'API mais de manière sécurisée en Server Action
    const cookieStore = await cookies()
    const response = await fetch(`${process.env.NEXT_PUBLIC_SITE_URL}/api/quotes/send-email`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Cookie': cookieStore.toString() // Forward auth cookies
      },
      body: JSON.stringify({ quoteId, subject, message, to })
    });

    const result = await response.json();
    if (!response.ok) throw new Error(result.error);

    revalidatePath(`/dashboard/quotes/${quoteId}`);
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function createInvoiceFromQuoteAction(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  try {
    const { data, error: rpcError } = await supabase.rpc('create_invoice_from_quote_v2', {
      p_quote_id: quoteId
    });

    if (rpcError) throw rpcError;

    const result = data as { invoiceId: string; message?: string; quote?: { id: string; public_token: string } };
    
    revalidatePath('/dashboard/invoices');
    revalidatePath(`/dashboard/quotes/${quoteId}`);
    
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || '';
    if (result.quote) {
      const shareUrl = `${baseUrl}/share/quotes/${result.quote.id}?token=${result.quote.public_token}`;
      const paymentUrl = `${shareUrl}&pay=true`;
    }
    
    return { success: true, invoiceId: result.invoiceId };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function trackQuoteViewAction(quoteId: string, publicToken: string) {
  // Use admin client to bypass standard RLS for public viewing but validate with token
  const supabase = createAdminClient()
  
  try {
    const { error } = await supabase.rpc('track_quote_view_v1' as any, {
      p_quote_id: quoteId,
      p_token: publicToken
    })

    if (error) throw error
    return { success: true }
  } catch (err) {
    // We don't fail the page load if tracking fails, just log it
    console.error('[trackQuoteViewAction] Error:', err)
    return { success: false }
  }
}

export async function generateQuoteTokenAction(quoteId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  try {
    const newToken = crypto.randomUUID()
    // Set expiration to 30 days from now 🛡️
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 30)

    const { error } = await supabase
      .from('quotes')
      .update({ 
        public_token: newToken,
        public_token_expires_at: expiresAt.toISOString()
      } as any)
      .eq('id', quoteId)
      .eq('user_id', user.id)

    if (error) throw error

    await revalidateDocumentCache()
    revalidatePath(`/dashboard/quotes/${quoteId}`)
    return { success: true, token: newToken, expiresAt: expiresAt.toISOString() }
  } catch (err: any) {
    return { success: false, error: err.message }
  }
}
