import { createClient } from '@/utils/supabase/server'
import { notFound } from 'next/navigation'
import { QuoteClient } from './QuoteClient'
import { Quote } from '@/types/dashboard'

export default async function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Fetch Quote, Client and Items
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', id)
    .single()

  if (error || !quote) {
    return notFound()
  }

  // 2. Fetch the Artisan's Profile separately to avoid join errors
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', quote.user_id)
    .single()

  // 3. Assemble the full data object
  const fullQuote: Quote = {
    ...quote,
    profiles: profile || undefined
  } as any as Quote

  return <QuoteClient quote={fullQuote} />
}
