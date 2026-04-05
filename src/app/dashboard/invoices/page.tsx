import { createClient } from '@/utils/supabase/server'
import { InvoicesClient } from './InvoicesClient'

export default async function InvoicesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  const userId = user?.id ?? ''
  
  const { data: invoices } = await supabase
    .from('invoices')
    .select('*, clients(*)')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      <InvoicesClient initialInvoices={invoices || []} userId={userId} />
    </div>
  )
}
