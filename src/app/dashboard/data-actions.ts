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

  // 🛰️ Alignement avec DataService (Utilise l'alias pour la cohérence)
  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients:client_id(name)') 
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DATABASE ERROR] getQuotesServer:', error)
    throw error
  }
  if (!data) return []

  // ✅ Validation Permissive & Résiliente
  return data.reduce<Quote[]>((acc, item) => {
    const result = quoteWithClientSchema.safeParse(item)
    if (result.success) {
      acc.push(result.data as any as Quote)
    } else {
      // Log détaillé pour identifier les records corrompus sans bloquer l'UI
      console.warn('[VALIDATION WARNING] Quote skipped:', item.id, result.error.format())
    }
    return acc
  }, [])
}

export async function getInvoicesServer(): Promise<Invoice[]> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  // 🛰️ Alignement avec DataService (Utilise l'alias pour la cohérence)
  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients:client_id(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('[DATABASE ERROR] getInvoicesServer:', error)
    throw error
  }
  if (!data) return []

  // ✅ Validation Permissive & Résiliente
  return data.reduce<Invoice[]>((acc, item) => {
    const result = invoiceWithClientSchema.safeParse(item)
    if (result.success) {
      acc.push(result.data as any as Invoice)
    } else {
      console.warn('[VALIDATION WARNING] Invoice skipped:', item.id, result.error.format())
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
    .select('*, quotes:quotes(id, status, total_ttc, created_at)')
    .eq('user_id', user.id)
    .order('name', { ascending: true })

  if (error) {
    console.error('[DATABASE ERROR] getClientsServer:', error)
    throw error
  }
  if (!data) return []

  // ✅ Validation Permissive
  return data.reduce<any[]>((acc, item) => {
    const result = clientWithQuotesSchema.safeParse(item)
    if (result.success) {
      acc.push(result.data)
    } else {
      console.warn('[VALIDATION WARNING] Client skipped:', item.id, result.error.format())
    }
    return acc
  }, [])
}
