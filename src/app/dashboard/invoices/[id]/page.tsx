import { createClient } from '@/utils/supabase/server'
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
    .select('*, clients(*), invoice_items(*)')
    .eq('id', id)
    .single()

  if (!invoice) {
    notFound()
  }

  // 2. Fetch the Artisan's Profile to check for Pro status
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_pro')
    .eq('id', invoice.user_id)
    .single()

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
