import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/supabase/cached-queries'
import { notFound } from 'next/navigation'
import { QuoteClient } from './QuoteClient'
import { Quote } from '@/types/dashboard'

export default async function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params

  // 1. Fetch Quote and Profile in parallel for maximum speed ⚡
  const [quoteRes, profile] = await Promise.all([
    supabase
      .from('quotes')
      .select(`
        id, number, client_id, status, total_ht, total_ttc, signature_url, stripe_session_id, user_id, created_at, updated_at, payment_method, payment_details,
        clients (id, name, email, phone, address, postal_code, city, country),
        quote_items (id, description, quantity, unit_price, total_price, tax_rate)
      `)
      .eq('id', id)
      .single(),
    getUserProfile()
  ])

  const { data: quote, error } = quoteRes

  if (error || !quote) {
    return notFound()
  }

  // 3. Assemble the full data object
  const fullQuote: Quote = {
    ...quote,
    profiles: profile || undefined
  } as any as Quote

  return <QuoteClient quote={fullQuote} />
}
