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

  return data as unknown as Profile
}

export async function updateProfile(formData: {
  company_name: string
  first_name?: string
  last_name?: string
  siret: string
  address: string
  phone: string
  num_contacts?: string
  annual_revenue?: string
  preferred_language?: string
}) {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) throw new Error('Not authenticated')

  const { error } = await (await supabase)
    .from('profiles')
    .update({
      company_name: formData.company_name,
      first_name: formData.first_name,
      last_name: formData.last_name,
      full_name: `${formData.first_name || ''} ${formData.last_name || ''}`.trim(),
      siret: formData.siret,
      address: formData.address,
      phone: formData.phone,
      num_contacts: formData.num_contacts,
      annual_revenue: formData.annual_revenue,
      preferred_language: formData.preferred_language,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    throw new Error('Failed to update profile')
  }

  revalidatePath('/dashboard/settings')
  return { success: true }
}

export async function createStripeAccount() {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const profile = await getProfile()
  if (!profile) throw new Error('Profil non trouvé')

  if (profile.stripe_account_id) return profile.stripe_account_id

  const account = await stripe.accounts.create({
    type: 'express',
    country: 'FR',
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

  // Store the accountId in the profile
  const { error } = await (await supabase)
    .from('profiles')
    .update({ stripe_account_id: account.id })
    .eq('id', user.id)

  if (error) throw error

  return account.id
}

export async function createStripeOnboardingLink() {
  const supabase = createClient()
  const { data: { user } } = await (await supabase).auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const accountId = await createStripeAccount()

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

export async function getStripeAccountStatus() {
  const profile = await getProfile()
  if (!profile?.stripe_account_id) return { isReady: false, exists: false }

  try {
    const account = await stripe.accounts.retrieve(profile.stripe_account_id)
    
    // Sync to DB
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (user) {
      await supabase
        .from('profiles')
        .update({
          stripe_details_submitted: account.details_submitted,
          stripe_charges_enabled: account.charges_enabled
        })
        .eq('id', user.id)
    }

    return {
      isReady: account.details_submitted && account.charges_enabled,
      detailsSubmitted: account.details_submitted,
      chargesEnabled: account.charges_enabled,
      exists: true,
      accountId: profile.stripe_account_id
    }
  } catch (err) {
    console.error('Error retrieving Stripe account:', err)
    return { isReady: false, exists: false }
  }
}
