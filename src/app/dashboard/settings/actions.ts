'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Profile } from '@/types/dashboard'

export async function getProfile(): Promise<Profile | null> {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) return null

  const { data, error } = await (await supabase)
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    console.error('Error fetching profile:', error)
    return null
  }

  return data as Profile
}

export async function updateProfile(formData: {
  company_name: string
  siret: string
  address: string
  phone: string
  // Add other fields you might need in `profiles` based on your DB schema. We'll update core ones for now.
}) {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await (await supabase)
    .from('profiles')
    .update({
      company_name: formData.company_name,
      siret: formData.siret,
      address: formData.address,
      phone: formData.phone,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}
