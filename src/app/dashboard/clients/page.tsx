import { createClient } from '@/utils/supabase/server'
import { ClientsClient } from './ClientsClient'
import { ClientWithQuotes } from '@/types/dashboard'
import { redirect } from 'next/navigation'
import { getCachedClients } from '@/utils/supabase/cached-queries'

export const metadata = {
  title: "Clients | ArtisanFlow",
  description: "Gérez votre base de données clients en toute sécurité.",
}

export default async function ClientsPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')
  
  const clients = await getCachedClients(user.id)

  return (
    <ClientsClient 
      initialClients={(clients || []) as ClientWithQuotes[]} 
      userId={user.id} 
    />
  )
}
