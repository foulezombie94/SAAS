'use server'

import { createClient } from '@/utils/supabase/server'
import { QuoteInsertSchema } from '@/lib/validations/quote'
import { getUsageLimits } from '@/app/dashboard/actions'

export async function createQuoteAction(rawData: unknown) {
  // 1. Validation Zod stricte : si ça échoue, ça lève une erreur qu'on attrape
  const parsed = QuoteInsertSchema.safeParse(rawData);
  
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation échouée' };
  }

  const data = parsed.data;

  // 2. Vérification DB / Auth
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return { success: false, error: 'Utilisateur non connecté' }
  }

  // Double check des limites (sécurité serveur absolue)
  const limitStatus = await getUsageLimits('quotes')
  if (!limitStatus.allowed) {
    return { success: false, error: "Limite atteinte. Passez en PRO pour continuer !" }
  }

  try {
    // 3. Insertion Atomique Stricte (Devis + Prestations) via RPC
    const { data: quote, error: rpcError } = await supabase.rpc('create_quote_with_items_v2', {
      p_user_id: user.id,
      p_client_id: data.client_id,
      p_status: data.status,
      p_total_ht: data.total_ht,
      p_tax_rate: data.tax_rate,
      p_total_ttc: data.total_ttc,
      p_items: data.items,
      p_payment_details: data.payment_details || undefined,
      p_payment_method: data.payment_method || undefined,
      p_valid_until: data.valid_until || undefined
    });

    if (rpcError) throw new Error(rpcError.message)

    return { success: true, quote }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la création atomique du devis' }
  }
}
