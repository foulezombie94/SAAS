'use server'

import { createClient } from '@/utils/supabase/server'
import { Quote, Invoice, Client } from '@/types/dashboard'

/**
 * 🛡️ Server Actions pour la récupération de données
 * Ces fonctions tournent sur le serveur et ont un accès direct aux cookies httpOnly.
 */

export async function getQuotesServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('quotes')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Quote[]
}

export async function getInvoicesServer() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as (Invoice & { clients: Client | null })[]
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
  const clients = data as any[]
  return clients.map(client => ({
    ...client,
    quotes: client.quotes || []
  }))
}
