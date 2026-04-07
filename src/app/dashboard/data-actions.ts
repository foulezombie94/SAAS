'use server'

import { createClient } from '@/utils/supabase/server'
import { Quote, Invoice, Client } from '@/types/dashboard'
import { 
  quoteWithClientSchema, 
  invoiceWithClientSchema, 
  clientWithQuotesSchema 
} from '@/lib/validations/database'

/**
 * 🛡️ Server Actions pour la récupération de données
 * Ces fonctions tournent sur le serveur et ont un accès direct aux cookies httpOnly.
 * Intégration de la validation Zod permissive (Grade 10).
 */

export async function getQuotesServer(): Promise<Quote[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  // On sélectionne l'objet client complet pour correspondre au type attendu par l'UI
  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients(*)') 
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data) return []

  // ✅ Validation Permissive : On filtre ce qui est corrompu et on log
  return data.reduce<Quote[]>((acc, item) => {
    const result = quoteWithClientSchema.safeParse(item)
    if (result.success) {
      acc.push(result.data as any as Quote)
    } else {
      console.error('[RUNTIME VALIDATION ERROR] Quote ID:', item.id, result.error.format())
    }
    return acc
  }, [])
}

export async function getInvoicesServer(): Promise<Invoice[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  if (!data) return []

  // ✅ Validation Permissive
  return data.reduce<Invoice[]>((acc, item) => {
    const result = invoiceWithClientSchema.safeParse(item)
    if (result.success) {
      acc.push(result.data as any as Invoice)
    } else {
      console.error('[RUNTIME VALIDATION ERROR] Invoice ID:', item.id, result.error.format())
    }
    return acc
  }, [])
}

export async function getClientsServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('clients')
    .select('*, quotes(*)')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) throw error
  if (!data) return []

  // ✅ Validation Permissive
  return data.reduce<any[]>((acc, item) => {
    const result = clientWithQuotesSchema.safeParse(item)
    if (result.success) {
      acc.push(result.data)
    } else {
      console.error('[RUNTIME VALIDATION ERROR] Client ID:', item.id, result.error.format())
    }
    return acc
  }, [])
}
