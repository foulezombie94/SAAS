import { createClient } from '@/utils/supabase/server'
import { ClientsClient } from './ClientsClient'
import { ClientWithQuotes } from '@/types/dashboard'
import { redirect } from 'next/navigation'

export const metadata = {
  title: "Clients | ArtisanFlow",
  description: "Gérez votre base de données clients en toute sécurité.",
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  const { data: clients } = await supabase
    .from('clients')
    .select('*, quotes(id, status, total_ttc, created_at)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  return (
    <ClientsClient 
      initialClients={(clients || []) as ClientWithQuotes[]} 
      userId={user.id} 
    />
  )
}
