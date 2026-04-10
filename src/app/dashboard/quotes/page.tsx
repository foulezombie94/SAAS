import { createClient } from '@/utils/supabase/server'
import { QuotesClient } from './QuotesClient'
import { Quote } from '@/types/dashboard'
import { redirect } from 'next/navigation'
import { getCachedAllQuotes } from '@/utils/supabase/cached-queries'

export const metadata = {
  title: "Devis | ArtisanFlow",
  description: "Gérez vos devis clients en toute simplicité.",
}

export default async function QuotesPage() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) redirect('/login')

  const quotes = await getCachedAllQuotes(user.id)

  return (
    <QuotesClient 
      initialQuotes={(quotes || []) as Quote[]} 
      userId={user.id} 
    />
  )
}
