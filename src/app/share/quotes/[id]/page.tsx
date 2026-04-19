import { notFound } from 'next/navigation'
import { createAdminClient } from '@/lib/supabase/admin'
import { QuotePublicView } from './QuotePublicView'
import { Quote } from '@/types/dashboard'
import { LinkExpired } from '@/components/share/LinkExpired'

import { ViewTracker } from './ViewTracker'

export default async function PublicQuotePage({ 
  params, 
  searchParams 
}: { 
  params: Promise<{ id: string }>,
  searchParams: Promise<{ token?: string }>
}) {
  const { id } = await params
  const { token } = await searchParams
  const supabase = createAdminClient()

  if (!token) {
    return notFound()
  }

  // 🛡️ SECURITY GRADE 3: Correlation mandatory between id and public_token
  // Fetch via Admin Client to bypass RLS for expired check visibility
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', id)
    .eq('public_token', token)
    .single()

  if (error || !quote) {
    return notFound()
  }

  // Fetch ONLY the safe Artisan's Profile fields
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_name, address, siret, phone, email, legal_form, tva_intra, stripe_charges_enabled')
    .eq('id', quote.user_id)
    .single()

  const fullQuote: Quote = {
    ...quote,
    profiles: profile || undefined
  } as any as Quote

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-0">
      <div className="max-w-5xl mx-auto">
        {/* 🕵️‍♂️ Traçage d'ouverture sécurisé */}
        <ViewTracker quoteId={id} publicToken={token} />
        <QuotePublicView quote={fullQuote} publicToken={token} />
      </div>
    </div>
  )
}
