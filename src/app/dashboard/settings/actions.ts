'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { Profile } from '@/types/dashboard'
import { stripe } from '@/lib/stripe'

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

export async function createStripeOnboardingLink() {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const profile = await getProfile()
  if (!profile) throw new Error('Profil non trouvé')

  let accountId = profile.stripe_account_id

  // 1. Create a Stripe account if they don't have one
  if (!accountId) {
    const account = await stripe.accounts.create({
      type: 'express',
      country: 'FR', // Default to France for now, can be dynamic
      email: user.email,
      capabilities: {
        card_payments: { requested: true },
        transfers: { requested: true },
      },
      business_type: 'individual',
      metadata: {
        userId: user.id,
      },
    })
    accountId = account.id

    // Store the accountId in the profile
    const { error } = await (await supabase)
      .from('profiles')
      .update({ stripe_account_id: accountId })
      .eq('id', user.id)

    if (error) throw error
  }

  // 2. Create an account link for onboarding
  const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: `${origin}/dashboard/settings?stripe=refresh`,
    return_url: `${origin}/dashboard/settings?stripe=success`,
    type: 'account_onboarding',
  })

  return { url: accountLink.url }
}

export async function disconnectStripe() {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await (await supabase)
    .from('profiles')
    .update({ stripe_account_id: null })
    .eq('id', user.id)

  if (error) throw error

  revalidatePath('/dashboard/settings')
  return { success: true }
}
