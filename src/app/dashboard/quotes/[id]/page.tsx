import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/supabase/cached-queries'
import { notFound } from 'next/navigation'
import { QuoteClient } from './QuoteClient'
import { Quote } from '@/types/dashboard'

export default async function QuoteViewPage({ params }: { params: Promise<{ id: string }> }) {
  const supabase = await createClient()
  const { id } = await params
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return notFound()

  // 1. Fetch Quote and Profile in parallel for maximum speed ⚡
  const [quoteRes, profile] = await Promise.all([
    supabase
      .from('quotes')
      .select(`
        id, number, client_id, status, total_ht, total_ttc, public_token, public_token_expires_at, artisan_signature_url, client_signature_url, signature_url, stripe_session_id, user_id, created_at, updated_at, payment_method, payment_details, last_viewed_at,
        clients (id, name, email, phone, address, postal_code, city, country),
        quote_items (id, description, quantity, unit_price, total_price, tax_rate)
      `)
      .eq('id', id)
      .single(),
    getUserProfile(user.id)
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
