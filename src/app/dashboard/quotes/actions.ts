'use server'

import { createClient } from '@/utils/supabase/server'
import { QuoteInsertSchema, QuoteAcceptSchema, QuoteEmailSchema } from '@/lib/validations/quote'
import { getUsageLimits } from '@/app/dashboard/actions'
import { revalidateTag, revalidatePath } from 'next/cache'
import { cookies } from 'next/headers'
import { rateLimit } from '@/lib/rate-limit'
import { createAdminClient } from '@/utils/supabase/admin'

export async function createQuoteAction(rawData: unknown) {
  // 1. Validation Zod stricte : si ça échoue, ça lève une erreur qu'on attrape
  const parsed = QuoteInsertSchema.safeParse(rawData);
  
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation échouée' };
  }

  const data = parsed.data;

  try {
    console.log('[createQuoteAction] Starting...');
    const supabase = await createClient()
    
    console.log('[createQuoteAction] Fetching user & limits...');
    const [authRes, limitStatus] = await Promise.all([
      supabase.auth.getUser(),
      getUsageLimits('quotes')
    ])

    const { data: { user } } = authRes
    if (!user) {
      console.warn('[createQuoteAction] No user found');
      return { success: false, error: 'Utilisateur non connecté' }
    }

    if (!limitStatus.allowed) {
      console.warn('[createQuoteAction] Limit reached');
      return { success: false, error: "Limite atteinte. Passez en PRO pour continuer !" }
    }

    console.log('[createQuoteAction] Calling RPC...');
    const { data: quote, error: rpcError } = await supabase.rpc('create_quote_with_items_v3', {
      p_client_id: data.client_id,
      p_status: data.status,
      p_total_ht: data.total_ht,
      p_tax_rate: data.tax_rate,
      p_total_ttc: data.total_ttc,
      p_items: data.items as any,
      p_payment_details: (data.payment_details || undefined) as any,
      p_payment_method: data.payment_method || undefined,
      p_valid_until: data.valid_until || undefined
    });

    if (rpcError) {
      console.error('[createQuoteAction] RPC Error:', rpcError);
      throw new Error(rpcError.message)
    }
    
    console.log('[createQuoteAction] Success:', quote);
    
    // 🚀 Cache Invalidation (Tag + Path)
    // 🚀 Cache Invalidation (Path-based for reliability)
    revalidatePath('/dashboard', 'layout')
    revalidatePath('/dashboard/quotes')

    return { success: true, quote }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la création atomique du devis' }
  }
}

export async function acceptQuoteAction(rawData: unknown) {
  const parsed = QuoteAcceptSchema.safeParse(rawData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  const { quoteId, signatureDataUrl } = parsed.data;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) return { success: false, error: "Non autorisé" };

  // 1. Rate Limit
  const limit = await rateLimit(`accept-${user.id}`, 3, 60000);
  if (!limit.success) return { success: false, error: limit.message };

  try {
    const adminSupabase = createAdminClient();
    const base64Data = signatureDataUrl.split(',')[1];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `sig_${quoteId}_${Date.now()}.png`;

    const { error: uploadError } = await adminSupabase.storage
      .from('signatures')
      .upload(fileName, buffer, { contentType: 'image/png', upsert: true });

    if (uploadError) throw uploadError;

    const { data: { publicUrl } } = adminSupabase.storage
      .from('signatures')
      .getPublicUrl(fileName);

    const { error: rpcError } = await supabase.rpc('accept_quote_v3', {
      p_quote_id: quoteId,
      p_public_token: '', // Not needed for authenticated artisan
      p_signature_url: publicUrl
    });

    if (rpcError) throw rpcError;

    revalidatePath(`/dashboard/quotes/${quoteId}`);
    return { success: true, signatureUrl: publicUrl };
  } catch (err: any) {
    return { success: false, error: err.message };
  }
}

export async function sendQuoteEmailAction(rawData: unknown) {
  const parsed = QuoteEmailSchema.safeParse(rawData);
  if (!parsed.success) return { success: false, error: parsed.error.issues[0]?.message };

  const { quoteId, subject, message } = parsed.data;
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
      body: JSON.stringify({ quoteId, subject, message })
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
