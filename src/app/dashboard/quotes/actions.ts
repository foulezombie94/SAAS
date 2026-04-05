'use server'

import { createClient } from '@/utils/supabase/server'
import { QuoteInsertSchema } from '@/lib/validations/quote'
import { getUsageLimits } from '@/app/dashboard/actions'
import { revalidateTag } from 'next/cache'
import { revalidatePath } from 'next/cache'

export async function createQuoteAction(rawData: unknown) {
  // 1. Validation Zod stricte : si ça échoue, ça lève une erreur qu'on attrape
  const parsed = QuoteInsertSchema.safeParse(rawData);
  
  if (!parsed.success) {
    return { success: false, error: parsed.error.issues[0]?.message || 'Validation échouée' };
  }

  const data = parsed.data;

  // 2. Vérification DB / Auth & Limites en PARALLÈLE ⚡
  const supabase = await createClient()
  const [authRes, limitStatus] = await Promise.all([
    supabase.auth.getUser(),
    getUsageLimits('quotes')
  ])

  const { data: { user } } = authRes
  if (!user) {
    return { success: false, error: 'Utilisateur non connecté' }
  }

  // Double check des limites (sécurité serveur absolue)
  if (!limitStatus.allowed) {
    return { success: false, error: "Limite atteinte. Passez en PRO pour continuer !" }
  }

  try {
    // 3. Insertion Atomique v3 (Zero Trust : user_id géré par SQL)
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

    if (rpcError) throw new Error(rpcError.message)
    
    // 🚀 Cache Invalidation (Tag + Path)
    revalidateTag(`dashboard-stats-${user.id}`, 'page')
    revalidatePath('/dashboard', 'page')

    return { success: true, quote }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la création atomique du devis' }
  }
}
