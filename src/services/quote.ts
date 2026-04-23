import { createClient } from '@/utils/supabase/server'
import { checkLimits } from '@/lib/limits'

export interface QuoteItemInput {
  description: string
  quantity: number
  unit_price: number
  total_price: number
}

export interface CreateQuoteInput {
  client_id: string
  number: string
  status?: 'draft' | 'sent' | 'accepted' | 'rejected' | 'invoiced' | 'paid' | 'overdue' | 'cancelled'
  total_ht: number
  tax_rate: number
  total_ttc: number
  items: QuoteItemInput[]
}

export async function getNextQuoteNumber() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilisateur non authentifié')

  const { data, error } = await supabase.rpc('get_next_quote_number', { p_user_id: user.id })
  if (error) throw error
  return data as string
}

export async function createQuote(input: CreateQuoteInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Utilisateur non authentifié')

  // Check limits using central utility
  const limitStatus = await checkLimits('quotes')
  if (!limitStatus.allowed) {
    throw new Error('Limite de 3 devis atteinte pour la version gratuite. Passez à la Pro pour un accès illimité !')
  }

  // 1. Create Quote with Items via RPC (Atomic Transaction)
  const { data: result, error: rpcError } = await supabase.rpc('create_quote_with_items_v3', {
    p_client_id: input.client_id,
    p_status: input.status || 'draft',
    p_total_ht: input.total_ht,
    p_tax_rate: input.tax_rate,
    p_total_ttc: input.total_ttc,
    p_items: input.items as any
  })

  if (rpcError) throw rpcError

  return result
}
