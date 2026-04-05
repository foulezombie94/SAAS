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
  status?: string
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

  // 1. Create Quote
  const { data: quote, error: quoteError } = await supabase
    .from('quotes')
    .insert([{
      user_id: user.id,
      client_id: input.client_id,
      number: input.number,
      status: input.status || 'draft',
      total_ht: input.total_ht,
      tax_rate: input.tax_rate,
      total_ttc: input.total_ttc
    }])
    .select()
    .single()

  if (quoteError) throw quoteError

  // 2. Create Items
  const itemsToInsert = input.items.map(item => ({
    quote_id: quote.id,
    ...item
  }))

  const { error: itemsError } = await supabase
    .from('quote_items')
    .insert(itemsToInsert)

  if (itemsError) throw itemsError

  return quote
}
