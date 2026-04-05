import { createClient } from '@/utils/supabase/server'
import { getUserProfile } from '@/utils/supabase/cached-queries'
import { notFound } from 'next/navigation'
import { InvoiceClient } from './InvoiceClient'

export default async function InvoiceDetailPage({
  params
}: {
  params: { id: string }
}) {
  const { id } = await params
  const supabase = await createClient()
  
  const { data: invoice } = await supabase
    .from('invoices')
    .select(`
      id, number, status, total_ht, total_ttc, created_at, due_date, stripe_session_id, user_id, quote_id,
      clients (id, name, email, phone, address, postal_code, city, country),
      invoice_items (id, description, quantity, unit_price, total_price, tax_rate)
    `)
    .eq('id', id)
    .single()

  if (!invoice) {
    notFound()
  }

  // 2. Fetch the Artisan's Profile to check for Pro status (via Cache)
  const profile = await getUserProfile()

  const invoiceWithProfile = {
    ...invoice,
    profiles: profile || undefined
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <InvoiceClient invoice={invoiceWithProfile} />
    </div>
  )
}
