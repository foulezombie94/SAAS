import { createClient } from '@/utils/supabase/server'
import { QuotesClient } from './QuotesClient'
import { Quote } from '@/types/dashboard'
import { redirect } from 'next/navigation'

export const metadata = {
  title: "Devis | ArtisanFlow",
  description: "Gérez vos devis clients en toute simplicité.",
}

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const { data: quotes } = await supabase
    .from('quotes')
    .select('*, clients(name)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <QuotesClient 
      initialQuotes={(quotes || []) as Quote[]} 
      userId={user.id} 
    />
  )
}
