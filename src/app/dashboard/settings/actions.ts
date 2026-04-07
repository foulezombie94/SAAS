'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath, revalidateTag } from 'next/cache'
import { Profile } from '@/types/dashboard'
import { stripe } from '@/lib/stripe'

export async function getProfile(): Promise<Profile | null> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  // SÉCURITÉ : Filtrage strict des champs identité (Grade 3) 🛡️
  const { data, error } = await supabase
    .from('profiles')
    .select('id, email, full_name, first_name, last_name, company_name, address, siret, phone, is_pro, plan, stripe_customer_id, stripe_account_id, stripe_details_submitted, stripe_charges_enabled, preferred_language, notification_preferences, business_description, statement_descriptor')
    .eq('id', user.id)
    .single()

  if (error || !data) {
    console.error('Error fetching profile:', error?.message)
    return null
  }

  return data as unknown as Profile
}

/**
 * Récupère les données sensibles (SMTP/Banque) uniquement pour les pages de configuration.
 * L'accès est protégé par la session utilisateur.
 */
export async function getSensitiveProfileData() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { data, error } = await supabase
    .from('profiles')
    .select('smtp_host, smtp_port, smtp_user, smtp_from, iban, bic, bank_name')
    .eq('id', user.id)
    .single()

  if (error) throw error
  return data
}

import { profileSchema, ProfileInput } from '@/lib/validations/profile'

export async function updateProfile(formData: ProfileInput) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { success: false, error: 'Non authentifié' }

  // 🛡️ BASTION DE SÉCURITÉ : Validation Schema Zod + Anti-XSS (Grade 3)
  let validatedData: ProfileInput
  try {
    validatedData = profileSchema.parse(formData)
  } catch (e: any) {
    const message = e?.errors?.[0]?.message || 'Données invalides'
    return { success: false, error: message }
  }

  const { error } = await supabase
    .from('profiles')
    .update({
      company_name: validatedData.company_name,
      first_name: validatedData.first_name,
      last_name: validatedData.last_name,
      full_name: `${validatedData.first_name || ''} ${validatedData.last_name || ''}`.trim(),
      siret: validatedData.siret,
      address: validatedData.address,
      phone: validatedData.phone,
      num_contacts: validatedData.num_contacts,
      annual_revenue: validatedData.annual_revenue,
      preferred_language: validatedData.preferred_language,
      business_description: validatedData.business_description,
      statement_descriptor: validatedData.statement_descriptor,
    })
    .eq('id', user.id)

  if (error) {
    console.error('Error updating profile:', error)
    return { success: false, error: 'Échec de la sauvegarde' }
  }

  // ♻️ REVALIDATION SYNCHRONISÉE (Grade 3)
  revalidatePath('/dashboard/settings')
  revalidatePath('/dashboard')
  
  return { success: true }
}

export async function createStripeAccount() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const profile = await getProfile()
  if (!profile) throw new Error('Profil non trouvé')

  if (profile.stripe_account_id) {
    try {
      // 🛡️ Vérifie si le compte existant est toujours valide sur Stripe
      await stripe.accounts.retrieve(profile.stripe_account_id)
      return profile.stripe_account_id
    } catch (err: any) {
      if (err.type === 'StripeInvalidRequestError' || err.statusCode === 404) {
        console.warn(`[STRIPE] Compte ${profile.stripe_account_id} introuvable. Nettoyage de la DB...`)
        // Efface l'ID invalide pour pouvoir en créer un nouveau
        await supabase.from('profiles').update({ stripe_account_id: null }).eq('id', user.id)
      } else {
        throw err
      }
    }
  }

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
  const { error: updateErr } = await supabase
    .from('profiles')
    .update({ 
      stripe_account_id: account.id,
      stripe_details_submitted: false,
      stripe_charges_enabled: false 
    })
    .eq('id', user.id)

  if (updateErr) throw updateErr

  return account.id
}

export async function createStripeOnboardingLink(returnPath?: string) {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { error: 'Non authentifié' }

    const accountId = await createStripeAccount()

    // 2. Create an account link for onboarding
    const origin = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
    const basePath = returnPath || '/dashboard/settings'
    
    const accountLink = await stripe.accountLinks.create({
      account: accountId,
      refresh_url: `${origin}${basePath}?stripe=refresh`,
      return_url: `${origin}${basePath}?stripe=success`,
      type: 'account_onboarding',
    })

    return { url: accountLink.url }
  } catch (err: any) {
    console.error('Stripe Onboarding Link Error:', err)
    return { error: err.message || 'Erreur lors de la création du lien Stripe' }
  }
}

export async function createStripeDashboardLink() {
  try {
    const profile = await getProfile()
    if (!profile?.stripe_account_id) throw new Error('Compte Stripe non trouvé')

    const loginLink = await stripe.accounts.createLoginLink(profile.stripe_account_id)
    return { url: loginLink.url }
  } catch (err: any) {
    console.error('Stripe Dashboard Link Error:', err)
    return { error: err.message || 'Erreur lors de la création du lien Stripe' }
  }
}

export async function disconnectStripe() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
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
  } catch (err: any) {
    console.error('Error retrieving Stripe account:', err)

    // 🛡️ AUTO-REPAIR: Si le compte n'existe plus sur Stripe, on nettoie notre DB
    if (err.type === 'StripeInvalidRequestError' || err.statusCode === 404) {
      const supabase = await createClient()
      const { data: { user } } = await supabase.auth.getUser()
      if (user) {
        console.warn(`[STRIPE AUTO-REPAIR] Nettoyage de l'ID compte invalide: ${profile.stripe_account_id}`)
        await supabase
          .from('profiles')
          .update({ 
            stripe_account_id: null,
            stripe_details_submitted: false,
            stripe_charges_enabled: false 
          })
          .eq('id', user.id)
      }
    }

    return { isReady: false, exists: false }
  }
}

export async function updateNotificationPreferences(preferences: any) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) throw new Error('Non authentifié')

  const { error } = await supabase
    .from('profiles')
    .update({ 
      notification_preferences: preferences 
    } as any)
    .eq('id', user.id)

  if (error) throw error

  revalidatePath('/dashboard/settings')
  return { success: true }
}
