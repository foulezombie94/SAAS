import { notFound } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/admin'
import { QuotePublicView } from './QuotePublicView'
import { Quote } from '@/types/dashboard'

export default async function PublicQuotePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const supabase = createAdminClient()

  // Fetch Quote, Client and Items using Admin client (bypasses RLS)
  const { data: quote, error } = await supabase
    .from('quotes')
    .select('*, clients(*), quote_items(*)')
    .eq('id', id)
    .single()

  if (error || !quote) {
    return notFound()
  }

  // Fetch the Artisan's Profile
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', quote.user_id)
    .single()

  const fullQuote: Quote = {
    ...quote,
    profiles: profile || undefined
  } as any as Quote

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 md:px-0">
      <div className="max-w-5xl mx-auto">
        <QuotePublicView quote={fullQuote} />
      </div>
    </div>
  )
}
