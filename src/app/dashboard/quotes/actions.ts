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
    // 3. Insertion stricte dans Supabase
    // Zod garantit que data.client_id n'est pas null, etc.
    const { data: quote, error: qError } = await supabase
      .from('quotes')
      .insert({
        user_id: user.id,
        client_id: data.client_id, // NOT NULL garanti par la BDD et Zod
        status: data.status,
        total_ht: data.total_ht,
        tax_rate: data.tax_rate,
        total_ttc: data.total_ttc,
        payment_details: data.payment_details,
        payment_method: data.payment_method,
        valid_until: data.valid_until
      })
      .select()
      .single()

    if (qError) throw new Error(qError.message)

    // Insertion des prestations (items)
    const { error: iError } = await supabase
      .from('quote_items')
      .insert(data.items.map(item => ({
        quote_id: quote.id,
        description: item.description,
        quantity: item.quantity,
        unit_price: item.unit_price,
        total_price: item.total_price,
        tax_rate: item.tax_rate,
        total_ht: item.total_ht,
        total_ttc: item.total_ttc
      })))

    if (iError) throw new Error(iError.message)

    return { success: true, quote }
  } catch (err: any) {
    return { success: false, error: err.message || 'Erreur lors de la création du devis' }
  }
}
