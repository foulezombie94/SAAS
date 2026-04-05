import { createClient } from './server'
import { cache } from 'react'

export const getUserProfile = cache(async () => {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  
  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, company_name, email, is_pro, plan, smtp_host')
    .eq('id', user.id)
    .single()

  return profile
})
