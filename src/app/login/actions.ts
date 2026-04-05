'use server'

import { createClient } from '@/utils/supabase/server'
import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'

export async function login(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string

  if (!email || !password) {
    return { error: 'Veuillez remplir tous les champs' }
  }

  const { data: { user }, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !user) {
    let errorMessage = error?.message || 'Email ou mot de passe incorrect'
    if (error?.message === 'Invalid login credentials') {
      errorMessage = 'Email ou mot de passe incorrect'
    }
    return { error: errorMessage }
  }

  // Check if onboarding is completed
  const { data: profile } = await supabase
    .from('profiles')
    .select('plan')
    .eq('id', user.id)
    .single()

  if (!profile?.plan) {
    redirect('/onboarding/transition')
  }

  // Removal of revalidatePath('/', 'layout') to eliminate "micro-delay"
  redirect('/dashboard')
}

export async function signup(prevState: any, formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const first_name = (formData.get('first_name') as string)?.trim()
  const last_name = (formData.get('last_name') as string)?.trim()
  const company_name = (formData.get('company_name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const num_contacts = (formData.get('num_contacts') as string)?.trim()
  const annual_revenue = (formData.get('annual_revenue') as string)?.trim()
  const preferred_language = (formData.get('preferred_language') as string)?.trim() || 'fr'

  if (!email || !password || !first_name || !last_name || !company_name) {
    return { error: 'Tous les champs marqués d\'une étoile sont obligatoires' }
  }

  const { data: { user }, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        full_name: `${first_name} ${last_name}`,
        first_name,
        last_name,
        company_name,
        phone,
        num_contacts,
        annual_revenue,
        preferred_language,
      },
    },
  })

  if (error) {
    return { error: error.message }
  }

  if (user) {
    redirect('/onboarding/transition')
  }

  redirect('/login?message=' + encodeURIComponent('Vérifiez votre boîte mail pour confirmer votre inscription !'))
}

export async function signOut() {
  const supabase = await createClient()
  await supabase.auth.signOut()
  redirect('/')
}
